// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageValue } from "../../typings/StorageValue";

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * Retrieve a local stored Mendix object identified by a unique key. When object is the client state it will be returned, if not it will be re-created. Note: when re-creating the local mendix object the Mendix Object ID will never be the same.
 * @param {string} key - This field is required.
 * @param {string} entity - This field is required.
 * @returns {Promise.<MxObject>}
 */
export async function GetStorageItemObject(key?: string, entity?: string): Promise<mendix.lib.MxObject> {
    // BEGIN USER CODE

    if (!key) {
        return Promise.reject(new Error("Input parameter 'Key' is required"));
    }

    if (!entity) {
        return Promise.reject(new Error("Input parameter 'Entity' is required"));
    }

    return getItem(key).then(result => {
        if (result === null) {
            return Promise.reject(new Error(`Storage item '${key}' does not exist`));
        }
        const value: StorageValue = JSON.parse(result);

        return getOrCreateMxObject(entity, value).then(newObject => {
            const newValue = serializeMxObject(newObject);
            return setItem(key, JSON.stringify(newValue)).then(() => newObject);
        });
    });

    function getItem(key: string): Promise<string | null> {
        if (navigator && navigator.product === "ReactNative") {
            return AsyncStorage.getItem(key);
        }

        if (window) {
            const value = window.localStorage.getItem(key);
            return Promise.resolve(value);
        }

        return Promise.reject(new Error("No storage API available"));
    }

    function setItem(key: string, value: string): Promise<void> {
        if (navigator && navigator.product === "ReactNative") {
            return AsyncStorage.setItem(key, value);
        }

        if (window) {
            window.localStorage.setItem(key, value);
            return Promise.resolve();
        }

        return Promise.reject(new Error("No storage API available"));
    }

    function getOrCreateMxObject(entity: string, value: StorageValue): Promise<mendix.lib.MxObject> {
        return getMxObject(value.guid).then(existingObject => {
            if (existingObject) {
                return existingObject;
            } else {
                return createMxObject(entity, value);
            }
        });
    }

    function getMxObject(guid: string): Promise<mendix.lib.MxObject | undefined> {
        return new Promise((resolve, reject) => {
            mx.data.get({
                guid,
                callback: mxObject => resolve(mxObject),
                error: error => reject(error)
            });
        });
    }

    function createMxObject(entity: string, value: StorageValue): Promise<mendix.lib.MxObject> {
        return new Promise((resolve, reject) => {
            mx.data.create({
                entity,
                callback: mxObject => {
                    Object.keys(value)
                        .filter(attribute => attribute !== "guid")
                        .forEach(attributeName => {
                            const attributeValue = value[attributeName];
                            mxObject.set(attributeName, attributeValue);
                        });
                    resolve(mxObject);
                },
                error: () => reject(new Error(`Could not create '${entity}' object`))
            });
        });
    }

    function serializeMxObject(object: mendix.lib.MxObject): StorageValue {
        return object.getAttributes().reduce<StorageValue>(
            (accumulator, attributeName) => {
                accumulator[attributeName] = object.get(attributeName);
                return accumulator;
            },
            { guid: object.getGuid() }
        );
    }
    // END USER CODE
}
