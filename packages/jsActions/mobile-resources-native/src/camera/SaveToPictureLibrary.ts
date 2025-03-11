import { CameraRoll } from "@react-native-camera-roll/camera-roll";

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * @param {MxObject} picture - This field is required.
 * @returns {Promise.<string>}
 */
export async function SaveToPictureLibrary(picture?: mendix.lib.MxObject): Promise<string> {
    // BEGIN USER CODE
    // Documentation: https://github.com/react-native-cameraroll/react-native-cameraroll

    if (!picture) {
        return Promise.reject(new Error("Input parameter 'Picture' is required"));
    }

    if (!picture.inheritsFrom("System.FileDocument")) {
        const entity = picture.getEntity();
        return Promise.reject(new Error(`Entity ${entity} does not inherit from 'System.FileDocument'`));
    }

    const guid = picture.getGuid();
    const changedDate = picture.get("changedDate") as number;
    const url = mx.data.getDocumentUrl(guid, changedDate);

    // Save the file as a photo to the camera roll.
    try {
        const savedUri = await CameraRoll.saveToCameraRoll(url, "photo");
        return savedUri.node.image.uri;
    } catch (error) {
        return Promise.reject(error);
    }
    // END USER CODE
}
