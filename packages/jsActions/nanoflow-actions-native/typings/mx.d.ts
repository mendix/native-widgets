// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace mx {
    interface ui {
        toggleSidebar: () => void;
        downloadFile: (args: {
            mxobject: mendix.lib.MxObject;
            target: "window" | "internal";
            error?: (err: Error) => void;
        }) => Promise<void>;
    }
    interface data {
        update: (param: { guid?: string | undefined; entity?: string | undefined; callback?: () => void }) => void;
    }
    interface session {
        clearCachedSessionData: () => Promise<void>;
    }
    interface MxInterface {
        reload: () => void;
        login2(
            username: string,
            password: string,
            useAuthToken: boolean,
            onSuccess: () => void,
            onError: () => void
        ): void;
    }
}
