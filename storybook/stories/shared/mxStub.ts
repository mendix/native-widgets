/**
 * Story-side stand-in for the `mx` client global.
 *
 * Nanoflow actions are plain async functions, not components, and most of them reach for `mx` —
 * the client object the Mendix runtime puts on the global scope. It is not a module, so Metro
 * cannot be pointed at a stub the way `mendix` is in metro.config.js: the actions read the bare
 * name `mx`, so the only way to satisfy them is to define that global before an action runs.
 *
 * This covers only the surface the actions in `nanoflow-actions-native/src` actually touch. Calls
 * are recorded rather than merely logged so a story can assert on what the runtime was asked to do
 * — for an action like `RefreshEntity`, whose whole observable effect is the `mx.data.update` call,
 * the recording is the only thing there is to show.
 */
import { Big } from "big.js";

export interface MxCall {
    method: string;
    args: unknown[];
}

/** A minimal MxObject: enough of the interface for the actions that serialize or read one. */
export interface FakeMxObject {
    getGuid(): string;
    getAttributes(): string[];
    get(name: string): string | number | boolean;
    set(name: string, value: unknown): void;
    getEntity(): string;
}

/**
 * Builds an MxObject stand-in over a plain attribute bag.
 *
 * `guid` is deliberately caller-supplied rather than generated: `GetGuid` and `FindObjectWithGUID`
 * are only meaningful against a known value, and a story that shows a random one cannot be read.
 */
export function fakeMxObject(
    guid: string,
    attributes: Record<string, string | number | boolean> = {},
    entity = "NanoflowCommons.Demo"
): FakeMxObject {
    const bag: Record<string, string | number | boolean> = { ...attributes };
    return {
        getGuid: () => guid,
        getAttributes: () => Object.keys(bag),
        get: name => bag[name],
        set: (name, value) => {
            // The real client stores Big/Date; keep them readable for a story readout instead.
            bag[name] = value instanceof Date ? value.toISOString() : String(value);
        },
        getEntity: () => entity
    };
}

/** What the stub should pretend the client's state is. */
export interface MxStubOptions {
    /** Objects `mx.data.get` can find, by guid. Anything else resolves undefined, as the real client does. */
    objects?: Record<string, FakeMxObject>;
    /** `mx.session.isGuest()` — decides whether `SignOut` logs out or reports false. */
    isGuest?: boolean;
    /** Status `mx.login`/`login2` reports. 200 signs in; 401 is the wrong-password path. */
    loginStatus?: number;
    /** Fails every `mx.data.create`, so a story can show the action's create-failed branch. */
    failCreate?: boolean;
}

export interface MxStub {
    /** Every recorded call, in order, for a story to render. */
    calls: MxCall[];
    /** Installs the stub as the global `mx` and returns a function that puts back what was there. */
    install(): () => void;
}

/**
 * Creates an `mx` stub and the recording around it.
 *
 * Nothing is installed until `install()` is called: story modules are all evaluated at app
 * startup, so defining a global at module scope would let one story's stub leak into every other.
 */
export function createMxStub(options: MxStubOptions = {}): MxStub {
    const { objects = {}, isGuest = false, loginStatus = 200, failCreate = false } = options;
    const calls: MxCall[] = [];
    const record = (method: string, ...args: unknown[]): void => {
        calls.push({ method, args });
        // eslint-disable-next-line no-console
        console.log(`[story] mx.${method}(${args.map(a => JSON.stringify(a) ?? String(a)).join(", ")})`);
    };

    let nextProgressId = 1;
    let createdCount = 0;

    const mxStub = {
        remoteUrl: "https://sandbox.example.mendixcloud.com/",
        appUrl: "https://sandbox.example.mendixcloud.com/",
        baseUrl: "https://sandbox.example.mendixcloud.com/",
        reload: () => record("reload"),
        logout: () => record("logout"),
        login: (username: string, _password: string, onSuccess: () => void, onError: (e: unknown) => void) => {
            record("login", username);
            // Only the username is recorded: the password is deliberately kept out of the log.
            loginStatus === 200 ? onSuccess() : onError({ status: loginStatus });
        },
        login2: (
            username: string,
            _password: string,
            useAuthToken: boolean,
            onSuccess: () => void,
            onError: (e: unknown) => void
        ) => {
            record("login2", username, useAuthToken);
            loginStatus === 200 ? onSuccess() : onError({ status: loginStatus });
        },
        session: {
            isGuest: () => {
                record("session.isGuest");
                return isGuest;
            },
            getConfig: (key: string) => {
                record("session.getConfig", key);
                return "session-0000-0000";
            },
            clearCachedSessionData: async () => {
                record("session.clearCachedSessionData");
            }
        },
        ui: {
            toggleSidebar: () => record("ui.toggleSidebar"),
            showProgress: (message?: string, blocking?: boolean) => {
                record("ui.showProgress", message, blocking);
                return nextProgressId++;
            },
            hideProgress: (id: number) => record("ui.hideProgress", id),
            confirmation: (args: { content: string; handler: () => void; onCancel?: () => void }) => {
                record("ui.confirmation", args.content);
                // Only reached on web; native ShowConfirmation uses Alert instead.
                args.handler();
            },
            downloadFile: async (args: { mxobject: FakeMxObject; target: string }) => {
                record("ui.downloadFile", args.mxobject.getGuid(), args.target);
            }
        },
        data: {
            get: (args: { guid: string; callback: (o?: FakeMxObject) => void; error?: (e: Error) => void }) => {
                record("data.get", args.guid);
                args.callback(objects[args.guid]);
            },
            create: (args: { entity: string; callback: (o: FakeMxObject) => void; error?: () => void }) => {
                record("data.create", args.entity);
                if (failCreate) {
                    args.error?.();
                    return;
                }
                args.callback(fakeMxObject(`created-${++createdCount}`, {}, args.entity));
            },
            update: (args: { guid?: string; entity?: string; callback?: () => void }) => {
                record("data.update", args.guid ?? args.entity);
                args.callback?.();
            },
            saveDocument: (
                guid: string,
                fileName: string,
                _options: unknown,
                _blob: unknown,
                onSuccess: () => void,
                _onError: (e: unknown) => void
            ) => {
                record("data.saveDocument", guid, fileName);
                onSuccess();
            },
            closeDbConnection: async () => {
                record("data.closeDbConnection");
            }
        }
    };

    return {
        calls,
        install() {
            const holder = globalThis as unknown as { mx?: unknown };
            const previous = holder.mx;
            const had = "mx" in holder;
            holder.mx = mxStub;
            return () => {
                had ? (holder.mx = previous) : delete holder.mx;
            };
        }
    };
}

/** Formats an action's resolved value for a readout, including the shapes JSON.stringify flattens. */
export function describeResult(value: unknown): string {
    if (value === undefined) {
        return "(void)";
    }
    if (value === null) {
        return "null";
    }
    if (value instanceof Big) {
        return `Big(${value.toString()})`;
    }
    if (Array.isArray(value)) {
        return `[${value.map(describeResult).join(", ")}]`;
    }
    // An MxObject stand-in — show guid and attributes, which is what the actions set.
    if (typeof value === "object" && typeof (value as FakeMxObject).getGuid === "function") {
        const object = value as FakeMxObject;
        const attributes = object
            .getAttributes()
            .map(name => `${name}=${object.get(name)}`)
            .join(", ");
        return `MxObject(${object.getGuid()})${attributes ? ` { ${attributes} }` : ""}`;
    }
    return typeof value === "string" ? value : JSON.stringify(value);
}
