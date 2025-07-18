// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import { NativeModules } from "react-native";
import notifee from "@notifee/react-native";

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * Clears all delivered notifications from notification tray
 * @returns {Promise.<void>}
 */
export async function ClearAllDeliveredNotifications(): Promise<void> {
    // BEGIN USER CODE
    // Documentation Documentation https://github.com/invertase/notifee
    if (NativeModules && !NativeModules.NotifeeApiModule) {
        return Promise.reject(new Error("Notifee native module is not available in your app"));
    }

    notifee.cancelAllNotifications();

    return Promise.resolve();
    // END USER CODE
}
