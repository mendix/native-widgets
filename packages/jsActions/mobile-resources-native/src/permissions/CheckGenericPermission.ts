// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import { Platform, NativeModules } from "react-native";
import { check, Permission, PERMISSIONS as RNPermissions } from "react-native-permissions";
import { ANDROIDPermissionName, IOSPermissionName } from "../../typings/RequestGenericPermission";

// BEGIN EXTRA CODE

const PERMISSIONS = {
    ANDROID: {
        ...RNPermissions.ANDROID,
        SCHEDULE_EXACT_ALARM: "android.permission.SCHEDULE_EXACT_ALARM"
    },
    IOS: RNPermissions.IOS
};

function mapPermissionName(permissionName: string): Permission | "android.permission.SCHEDULE_EXACT_ALARM" | undefined {
    if (Platform.OS === "ios") {
        const nameWithoutSuffix = permissionName.replace("_IOS", "") as IOSPermissionName;

        return PERMISSIONS.IOS[nameWithoutSuffix] as Permission;
    }

    const nameWithoutSuffix = permissionName.replace("_ANDROID", "") as ANDROIDPermissionName;

    return PERMISSIONS.ANDROID[nameWithoutSuffix] as Permission;
}

async function checkScheduleAlarm(): Promise<"granted" | "blocked"> {
    if (NativeModules && !NativeModules.ScheduleEA) {
        return Promise.reject(new Error("ScheduleEA module is not available in your app"));
    }

    if (Platform.OS !== "android") {
        return Promise.resolve("granted");
    }

    const checkPermissionPromise = new Promise(resolve => {
        NativeModules.ScheduleEA.checkPermission((isEnabled: boolean) => {
            resolve(isEnabled);
        });
    });

    return checkPermissionPromise.then(result => {
        return Promise.resolve(result ? "granted" : "blocked");
    });
}

// END EXTRA CODE

/**
 * @param {"NanoflowCommons.Enum_Permissions.APP_TRACKING_TRANSPARENCY_IOS"|"NanoflowCommons.Enum_Permissions.BLUETOOTH_PERIPHERAL_IOS"|"NanoflowCommons.Enum_Permissions.CAMERA_IOS"|"NanoflowCommons.Enum_Permissions.CALENDARS_IOS"|"NanoflowCommons.Enum_Permissions.CONTACTS_IOS"|"NanoflowCommons.Enum_Permissions.FACE_ID_IOS"|"NanoflowCommons.Enum_Permissions.LOCATION_ALWAYS_IOS"|"NanoflowCommons.Enum_Permissions.LOCATION_WHEN_IN_USE_IOS"|"NanoflowCommons.Enum_Permissions.MEDIA_LIBRARY_IOS"|"NanoflowCommons.Enum_Permissions.MICROPHONE_IOS"|"NanoflowCommons.Enum_Permissions.MOTION_IOS"|"NanoflowCommons.Enum_Permissions.PHOTO_LIBRARY_IOS"|"NanoflowCommons.Enum_Permissions.PHOTO_LIBRARY_ADD_ONLY_IOS"|"NanoflowCommons.Enum_Permissions.REMINDERS_IOS"|"NanoflowCommons.Enum_Permissions.SIRI_IOS"|"NanoflowCommons.Enum_Permissions.SPEECH_RECOGNITION_IOS"|"NanoflowCommons.Enum_Permissions.STOREKIT_IOS"|"NanoflowCommons.Enum_Permissions.ACCEPT_HANDOVER_ANDROID"|"NanoflowCommons.Enum_Permissions.ACCESS_BACKGROUND_LOCATION_ANDROID"|"NanoflowCommons.Enum_Permissions.ACCESS_COARSE_LOCATION_ANDROID"|"NanoflowCommons.Enum_Permissions.ACCESS_FINE_LOCATION_ANDROID"|"NanoflowCommons.Enum_Permissions.ACCESS_MEDIA_LOCATION_ANDROID"|"NanoflowCommons.Enum_Permissions.ACTIVITY_RECOGNITION_ANDROID"|"NanoflowCommons.Enum_Permissions.ADD_VOICEMAIL_ANDROID"|"NanoflowCommons.Enum_Permissions.ANSWER_PHONE_CALLS_ANDROID"|"NanoflowCommons.Enum_Permissions.BLUETOOTH_ADVERTISE_ANDROID"|"NanoflowCommons.Enum_Permissions.BLUETOOTH_CONNECT_ANDROID"|"NanoflowCommons.Enum_Permissions.BLUETOOTH_SCAN_ANDROID"|"NanoflowCommons.Enum_Permissions.BODY_SENSORS_ANDROID"|"NanoflowCommons.Enum_Permissions.CALL_PHONE_ANDROID"|"NanoflowCommons.Enum_Permissions.CAMERA_ANDROID"|"NanoflowCommons.Enum_Permissions.GET_ACCOUNTS_ANDROID"|"NanoflowCommons.Enum_Permissions.PROCESS_OUTGOING_CALLS_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_CALENDAR_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_CALL_LOG_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_CONTACTS_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_EXTERNAL_STORAGE_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_PHONE_NUMBERS_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_PHONE_STATE_ANDROID"|"NanoflowCommons.Enum_Permissions.READ_SMS_ANDROID"|"NanoflowCommons.Enum_Permissions.RECEIVE_MMS_ANDROID"|"NanoflowCommons.Enum_Permissions.RECEIVE_SMS_ANDROID"|"NanoflowCommons.Enum_Permissions.RECEIVE_WAP_PUSH_ANDROID"|"NanoflowCommons.Enum_Permissions.RECORD_AUDIO_ANDROID"|"NanoflowCommons.Enum_Permissions.SEND_SMS_ANDROID"|"NanoflowCommons.Enum_Permissions.USE_SIP_ANDROID"|"NanoflowCommons.Enum_Permissions.WRITE_CALENDAR_ANDROID"|"NanoflowCommons.Enum_Permissions.WRITE_CALL_LOG_ANDROID"|"NanoflowCommons.Enum_Permissions.WRITE_CONTACTS_ANDROID"|"NanoflowCommons.Enum_Permissions.WRITE_EXTERNAL_STORAGE_ANDROID"|"NanoflowCommons.Enum_Permissions.SCHEDULE_EXACT_ALARM_ANDROID"} permission - This field is required.
 * @returns {Promise.<"NanoflowCommons.Enum_PermissionStatus.unavailable"|"NanoflowCommons.Enum_PermissionStatus.denied"|"NanoflowCommons.Enum_PermissionStatus.limited"|"NanoflowCommons.Enum_PermissionStatus.granted"|"NanoflowCommons.Enum_PermissionStatus.blocked">}
 */
export async function CheckGenericPermission(
    permission?: string
): Promise<"unavailable" | "blocked" | "denied" | "granted" | "limited"> {
    // BEGIN USER CODE
    if (!permission) {
        return Promise.reject(new Error("Input parameter 'permission' is required"));
    }
    const mappedPermissionName = mapPermissionName(permission);

    if (!mappedPermissionName) {
        console.error(`${permission} permission is not found`);
        return Promise.resolve("unavailable");
    }

    return mappedPermissionName === PERMISSIONS.ANDROID.SCHEDULE_EXACT_ALARM
        ? checkScheduleAlarm()
        : check(mappedPermissionName as Permission);
    // END USER CODE
}