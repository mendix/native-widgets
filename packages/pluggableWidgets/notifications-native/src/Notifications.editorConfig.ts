import { StructurePreviewProps, getColors } from "@mendix/piw-utils-internal";

import { NotificationsPreviewProps } from "../typings/NotificationsProps";

export const getPreview = (values: NotificationsPreviewProps, isDarkMode: boolean): StructurePreviewProps => {
    const colors = getColors(isDarkMode);
    const textColor: string = colors.text.primary;
    return {
        type: "RowLayout",
        borders: true,
        borderRadius: 4,
        backgroundColor: colors.background.topBar.standard,
        columnSize: "grow",
        children: [
            {
                type: "Container",
                padding: 16,
                children: [
                    ...((values.actions.length === 0
                        ? [
                              {
                                  type: "Text",
                                  content: "Configure your notification"
                              }
                          ]
                        : [
                              {
                                  type: "Text",
                                  bold: true,
                                  fontColor: textColor,
                                  fontSize: 10,
                                  italic: !values.title,
                                  content: values.title ? `{${values.title}}` : "No title"
                              },
                              {
                                  type: "Text",
                                  fontSize: 9,
                                  fontColor: textColor,
                                  italic: !values.subtitle,
                                  content: values.subtitle ? `{${values.subtitle}}` : "No subtitle"
                              },
                              {
                                  type: "Text",
                                  fontSize: 8,
                                  fontColor: textColor,
                                  italic: !values.body,
                                  content: values.body ? `{${values.body}}` : "No body"
                              }
                          ]) as StructurePreviewProps[])
                ]
            }
        ]
    };
};
