import { JsAction } from "../src/Signature";

declare global {
    // eslint-disable-next-line no-var
    var __com_mendix_widget_native_signature: { [key: string]: JsAction };
}
