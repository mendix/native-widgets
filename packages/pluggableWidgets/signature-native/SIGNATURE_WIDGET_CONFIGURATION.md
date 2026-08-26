# Signature Widget - Configuration Guide

## Overview

This guide covers the required configuration and best practices for implementing the Signature widget in your Mendix Native Mobile application. It includes instructions for new implementations as well as migration steps for existing projects using the Signature widget.

---

## Advantages of the New Signature Widget

The updated Signature widget simplifies configuration and reduces manual setup:

-   No need to manually assign a base64 string to an entity attribute.
-   The base64DecodeToImage action and commit object activity are no longer required in your nanoflow.
-   For entities with synchronization mode set to **All Objects**, you only need to add a synchronize action if required by your implementation. For entities with synchronization mode set to **Online**, synchronization is not required.

---

## Required Configuration for New Implementations

### 1. Image Property (Required)

The `Image` property must be configured with an entity that **generalizes System.Image**.

**Configuration Steps:**

1. **Create an entity that generalizes System.Image:**

    ```
    Example:
       Entity: CustomerSignature
       Generalization: System.Image
    ```

2. **Configure the widget:**
    - In the **Data source** section, set the `Image` property to your System.Image entity object.
    - The image type must be **Dynamic** (not static).

**Studio Pro Validation:**

-   Selecting Static images will display the error: _"Image must be a dynamic image type. Static images cannot be uploaded to."_
-   Dynamic System.Image entities will be accepted.

---

### 2. On Sign End Action (Required)

The `On sign end` action is **required** and triggers when the user clicks the Save button to save the signature to the image object.

**Supported Action Types:**

-   **Call a nanoflow**
-   **Call a microflow**
-   **Save changes**

**Important:**

-   If the `On sign end` action is not configured with one of the supported action types, the signature will not be saved. The operation will fail silently without displaying a Studio Pro error.

---

## Migration Steps for Existing Projects

### What Changed

Previously, you needed to store the base64-encoded signature string in a String attribute, then call a nanoflow that used the **base64DecodeToImage** action to convert the string into an image, and finally commit the object before continuing with your flow. With this update, the widget now handles the base64-to-image conversion internally, eliminating this overhead.

**Key Changes:**

1. The widget now saves the signature directly to an entity that generalizes `System.Image`, instead of storing a base64-encoded string in a String attribute.
2. The **On save** event has been renamed to **On sign end** under the **Events** tab.

### Example: Migrating from Studio Pro 10.24 or Earlier

The following is a step-by-step walkthrough of migrating a Mendix app from Studio Pro 10.24 or an earlier 11.x.x version to a version that includes the updated Signature widget.

1. **Resolve migration errors** — After converting the app to the new Studio Pro version, you may see errors about outdated modules: **NanoflowCommons** and **Native Mobile Resources**. These errors are unrelated to the Signature widget. Update both modules from the Marketplace to resolve these errors.

    ![Update NanoflowCommons and Native Mobile Resources](assets/migration/Update-NC-NMR.png)

2. **Update the widget** — If an **Update widget** error appears, click **Update** (or **Update all widgets**) to apply the new version.

    ![Update Widget](assets/migration/Update-Widget.png)

3. **Configure the Image property** — After updating, a new validation error will appear: _Property Image is required_.

    ![Property Image Required Error](assets/migration/PropertyImageRequiredError.png)

    To resolve this, open the Signature widget configuration and select the appropriate `System.Image` object reference in the **Image** property with image type set to **Dynamic**:

    ![Assign Object to Image Property](assets/migration/AssignObjectToImageProperty.png)

4. **Update the On sign end action** — In the **Events** tab, assign the nanoflow or other supported action that was previously used for **On save** to the **On sign end** action. You must assign either a nanoflow, microflow, or save changes action.

    ![Assign Nanoflow to On Sign End](assets/migration/AssignNanoflowToOnSignEnd.png)

    Next, open the nanoflow and remove the **base64DecodeToImage** action and **Commit object** activity, as they are no longer required. Keeping the **base64DecodeToImage** action will fail the signature from being stored. Keep your existing actions for ex.- **Synchronize** or **Close page**.

    ![Nanoflow with Removed Base64DecodeToImage](assets/migration/NanoflowOnSignEnd.png)

---

## Troubleshooting

### Error: "Property Image is required"

**Cause:** The Image property is not configured.

**Solution:**

1. Select the Signature widget.
2. In the **Data source** section, configure the Image property.
3. Select a System.Image entity object.

### Error: "Image must be a dynamic image type. Static images cannot be upload to"

**Cause:** You selected a static image type.

**Solution:**

1. Create an entity that generalizes System.Image.
2. In the Signature widget, set the Image property to use a dynamic image type.
3. Select the System.Image entity object.

### Signature is not being stored in the object

**Cause:** The `On sign end` action is not configured with a supported action type.

**Solution:**

1. Configure the `On sign end` action with a supported action type: call a nanoflow, call a microflow, or save changes.
2. Implement your project-specific logic inside the nanoflow or microflow. You can use other actions (for ex.- show page or close page) within the nanoflow or microflow as needed.

---
