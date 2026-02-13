export const regex: {
    excludeFiles: RegExp;
};

export function execShellCommand(command: string, cwd?: string): Promise<string>;

export function getFiles(folder: string, extensions?: string[]): Promise<string[]>;

export function getPackageInfo(folder: string): Promise<any>;

export function cloneRepo(githubUrl: string, localFolder: string): Promise<void>;

export function createMPK(tmpFolder: string, moduleInfo: any, excludeFilesRegExp: RegExp): Promise<string>;

export function exportModuleWithWidgets(
    moduleNameInModeler: string,
    mpkOutput: string,
    nativeWidgetFolders: string[],
    ossFiles?: Array<{ src: string; dest: string }>
): Promise<void>;
