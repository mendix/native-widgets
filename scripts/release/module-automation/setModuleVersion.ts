import { createHash } from "crypto";
import { readFile, writeFile, access, readdir } from "fs/promises";
import { join } from "path";

// Replace with `import { DatabaseSync } from "node:sqlite"` once @types/node is upgraded.
type SqliteValue = null | number | bigint | string | Uint8Array;

type SqliteStatement = {
    all(...parameters: SqliteValue[]): Array<Record<string, SqliteValue>>;
    run(...parameters: SqliteValue[]): unknown;
};

type SqliteDatabase = {
    prepare(sql: string): SqliteStatement;
    close(): void;
};

type SqliteModule = {
    DatabaseSync: new (path: string) => SqliteDatabase;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = require("node:sqlite") as SqliteModule;

const BSON_STRING = 0x02;

const bsonValueSize: Record<number, (buffer: Buffer) => number> = {
    0x01: () => 8, // double
    0x02: buffer => 4 + buffer.readInt32LE(0), // string
    0x03: buffer => buffer.readInt32LE(0), // embedded document
    0x04: buffer => buffer.readInt32LE(0), // array
    0x05: buffer => 5 + buffer.readInt32LE(0), // binary (int32 + subtype byte)
    0x07: () => 12, // ObjectId
    0x08: () => 1, // boolean
    0x09: () => 8, // UTC datetime
    0x0a: () => 0, // null
    0x10: () => 4, // int32
    0x11: () => 8, // timestamp
    0x12: () => 8 // int64
};

type BsonElement = {
    type: number;
    valueStart: number;
    elementStart: number;
    elementEnd: number;
};

// Nested documents are skipped as a unit, so a `Version` inside a JarDependency is never
// mistaken for the module's.
function findTopLevelElement(unit: Buffer, fieldName: string): BsonElement | null {
    let offset = 4; // skip the document's total-length prefix
    while (offset < unit.length - 1) {
        const type = unit[offset];
        if (type === 0x00) {
            return null; // end-of-document marker
        }
        const nameStart = offset + 1;
        const nameEnd = unit.indexOf(0x00, nameStart);
        if (nameEnd === -1) {
            throw new Error("Malformed unit: unterminated field name");
        }
        const name = unit.toString("utf8", nameStart, nameEnd);
        const valueStart = nameEnd + 1;
        const sizeOf = bsonValueSize[type];
        if (!sizeOf) {
            throw new Error(`Malformed unit: unsupported BSON type 0x${type.toString(16)} for field "${name}"`);
        }
        const valueSize = sizeOf(unit.subarray(valueStart));
        if (name === fieldName) {
            return { type, valueStart, elementStart: offset, elementEnd: valueStart + valueSize };
        }
        offset = valueStart + valueSize;
    }
    return null;
}

export function readTopLevelString(unit: Buffer, fieldName: string): string | null {
    const element = findTopLevelElement(unit, fieldName);
    if (!element || element.type !== BSON_STRING) {
        return null;
    }
    // Value is an int32 byte length (including the trailing null) followed by the bytes.
    return unit.toString("utf8", element.valueStart + 4, element.elementEnd - 1);
}

export function replaceTopLevelString(unit: Buffer, fieldName: string, value: string): Buffer {
    const element = findTopLevelElement(unit, fieldName);
    if (!element || element.type !== BSON_STRING) {
        throw new Error(`Malformed unit: no top-level string field "${fieldName}"`);
    }
    const bytes = Buffer.from(value, "utf8");
    const length = Buffer.alloc(4);
    length.writeInt32LE(bytes.length + 1, 0);
    const encoded = Buffer.concat([
        Buffer.from([BSON_STRING]),
        Buffer.from(`${fieldName}\0`, "utf8"),
        length,
        bytes,
        Buffer.from([0x00])
    ]);
    const patched = Buffer.concat([unit.subarray(0, element.elementStart), encoded, unit.subarray(element.elementEnd)]);
    // BSON documents are length-prefixed, so the header must follow a size change.
    patched.writeInt32LE(patched.length, 0);
    return patched;
}

function hashUnit(unit: Buffer): string {
    return createHash("sha256").update(unit).digest("base64");
}

// UnitID blobs are UUIDs in mixed-endian ("bytes_le") form: the first three groups are
// little-endian, the remaining bytes big-endian.
function unitIdToUuid(unitId: Uint8Array): string {
    const bytes = Buffer.from(unitId);
    if (bytes.length !== 16) {
        throw new Error(`Malformed UnitID: expected 16 bytes, got ${bytes.length}`);
    }
    return [
        Buffer.from(bytes.subarray(0, 4)).reverse().toString("hex"),
        Buffer.from(bytes.subarray(4, 6)).reverse().toString("hex"),
        Buffer.from(bytes.subarray(6, 8)).reverse().toString("hex"),
        bytes.subarray(8, 10).toString("hex"),
        bytes.subarray(10, 16).toString("hex")
    ].join("-");
}

// Not using getFiles from commons.js: it requires this module, and the cycle would leave it
// undefined.
export async function findProjectFile(projectDir: string): Promise<string> {
    const entries = await readdir(projectDir, { withFileTypes: true });
    const projectFile = entries.find(entry => entry.isFile() && entry.name.endsWith(".mpr"));
    if (!projectFile) {
        throw new Error(`No .mpr file found in ${projectDir}`);
    }
    return join(projectDir, projectFile.name);
}

type UnitRow = {
    UnitID: Uint8Array;
    ContainerID: Uint8Array | null;
    ContainmentName: string | null;
    Contents?: Uint8Array | null;
};

type ModuleSettings = {
    unit: UnitRow;
    contents: Buffer;
    isInline: boolean;
    unitPath: (unitId: Uint8Array) => string;
};

async function locateModuleSettings(
    database: SqliteDatabase,
    projectDir: string,
    projectFile: string,
    moduleName: string
): Promise<ModuleSettings> {
    const columns = database.prepare(`PRAGMA table_info(Unit)`).all();
    // Storage format v2 keeps unit bytes in the database; v1 keeps them on disk.
    const isInline = columns.some((column: Record<string, SqliteValue>) => column.name === "Contents");
    const units = database
        .prepare(`SELECT UnitID, ContainerID, ContainmentName${isInline ? ", Contents" : ""} FROM Unit`)
        .all() as unknown as UnitRow[];

    const unitPath = (unitId: Uint8Array): string => {
        const name = unitIdToUuid(unitId);
        return join(projectDir, "mprcontents", name.slice(0, 2), name.slice(2, 4), `${name}.mxunit`);
    };
    const readUnit = async (unit: UnitRow): Promise<Buffer> => {
        if (isInline) {
            return unit.Contents ? Buffer.from(unit.Contents) : Buffer.alloc(0);
        }
        const path = unitPath(unit.UnitID);
        try {
            await access(path);
        } catch {
            return Buffer.alloc(0);
        }
        return readFile(path);
    };
    const idOf = (value: Uint8Array): string => Buffer.from(value).toString("hex");

    let moduleId: string | null = null;
    for (const unit of units.filter(candidate => candidate.ContainmentName === "Modules")) {
        const contents = await readUnit(unit);
        if (contents.length && readTopLevelString(contents, "Name") === moduleName) {
            moduleId = idOf(unit.UnitID);
            break;
        }
    }
    if (!moduleId) {
        throw new Error(`Module "${moduleName}" not found in ${projectFile}`);
    }

    const settings = units.find(
        unit => unit.ContainmentName === "ModuleSettings" && unit.ContainerID && idOf(unit.ContainerID) === moduleId
    );
    if (!settings) {
        throw new Error(`Module "${moduleName}" has no ModuleSettings unit in ${projectFile}`);
    }

    const contents = await readUnit(settings);
    if (!contents.length) {
        throw new Error(`ModuleSettings unit for "${moduleName}" is empty in ${projectFile}`);
    }
    return { unit: settings, contents, isInline, unitPath };
}

/**
 * Read a module's version from the `Version` field of its Projects$ModuleSettings unit.
 * Returns null when the field is absent.
 */
export async function readModuleVersionFromProject(projectDir: string, moduleName: string): Promise<string | null> {
    const projectFile = await findProjectFile(projectDir);
    const database = new DatabaseSync(projectFile);
    try {
        const { contents } = await locateModuleSettings(database, projectDir, projectFile, moduleName);
        return readTopLevelString(contents, "Version");
    } finally {
        database.close();
    }
}

/**
 * Set a module's version inside a Mendix project file, the way Studio Pro does: the
 * `Version` field of the module's Projects$ModuleSettings unit, with Unit.ContentsHash
 * updated to base64(sha256(unit bytes)). Used when `mx set-module-version` refuses the
 * module, which it does for any module not authored as an add-on module.
 */
export async function setModuleVersionInProject(
    projectDir: string,
    moduleName: string,
    version: string
): Promise<void> {
    if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
        throw new Error(`Cannot set module version: "${version}" is not a SemVer major.minor.patch version`);
    }
    const projectFile = await findProjectFile(projectDir);
    const database = new DatabaseSync(projectFile);
    try {
        const {
            unit: settings,
            contents,
            isInline,
            unitPath
        } = await locateModuleSettings(database, projectDir, projectFile, moduleName);
        const currentVersion = readTopLevelString(contents, "Version");
        if (currentVersion === null) {
            throw new Error(`ModuleSettings unit for "${moduleName}" has no Version field in ${projectFile}`);
        }
        if (currentVersion === version) {
            console.log(`Module "${moduleName}" version is already ${version}.`);
            return;
        }

        console.log(`Setting module "${moduleName}" version from ${currentVersion} to ${version}..`);
        const patched = replaceTopLevelString(contents, "Version", version);
        if (readTopLevelString(patched, "Version") !== version) {
            throw new Error(`Failed to set version ${version} for module "${moduleName}"`);
        }
        if (isInline) {
            database
                .prepare(`UPDATE Unit SET Contents = ?, ContentsHash = ? WHERE UnitID = ?`)
                .run(patched, hashUnit(patched), settings.UnitID);
        } else {
            await writeFile(unitPath(settings.UnitID), patched);
            database
                .prepare(`UPDATE Unit SET ContentsHash = ? WHERE UnitID = ?`)
                .run(hashUnit(patched), settings.UnitID);
        }
    } finally {
        database.close();
    }
}
