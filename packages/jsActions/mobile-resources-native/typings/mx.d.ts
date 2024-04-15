declare namespace mx {
    interface MxInterface {
        readFileBlob: (filePath: string) => Promise<string>;
    }
}
