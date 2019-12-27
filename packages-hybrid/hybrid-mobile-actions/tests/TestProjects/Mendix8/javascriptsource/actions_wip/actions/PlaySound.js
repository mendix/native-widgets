// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import { Big } from "big.js";

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * Info about supported audio file formats:
 * - iOS: https://developer.apple.com/library/content/documentation/MusicAudio/Conceptual/CoreAudioOverview/SupportedAudioFormatsMacOSX/SupportedAudioFormatsMacOSX.html
 * - Android: https://developer.android.com/guide/topics/media/media-format
 * @param {MxObject} audioFile - This field is required. Common supported file formats are mp3, wav, m4a, mp4.
 * @returns {Promise.<boolean>}
 */
export async function PlaySound(audioFile) {
    // BEGIN USER CODE
    // Requires cordova-plugin-media
    if (!Media) {
        throw new Error("PlaySound action requires cordova-plugin-media to be installed in the app");
    }
    if (!audioFile) {
        throw new Error("Input parameter 'Audio file' is required");
    }
    if (!audioFile.inheritsFrom("System.FileDocument")) {
        var entity = audioFile.getEntity();
        throw new Error("Entity ".concat(entity, " does not inherit from 'System.FileDocument'"));
    }
    if (!audioFile.get("HasContents")) {
        throw new Error("Audio file does not have an content");
    }
    return new Promise(function(resolve, reject) {
        var guid = audioFile.getGuid();
        var changedDate = audioFile.get("changedDate");
        var url = mx.data.getDocumentUrl(guid, changedDate);
        var audio = new Media(url, onSuccess, onError);
        function onSuccess() {
            audio.release();
            resolve();
        }
        function onError(error) {
            reject(error);
        }
        setTimeout(function() {
            return audio.play();
        }, 100); // unknown why a delay is required
    });
    // END USER CODE
}