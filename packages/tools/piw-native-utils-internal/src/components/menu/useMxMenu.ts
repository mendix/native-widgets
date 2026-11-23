import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { MenuRect } from "./position";

export interface MxMenuControl {
    /** Put on the element that opens the menu: it is measured so the menu can be placed next to it */
    anchorRef: RefObject<View | null>;
    /** Where the trigger is in the window, as measured when the menu was opened */
    anchor: MenuRect | null;
    visible: boolean;
    /** Whether the menu is open, for the trigger's `accessibilityState.expanded` */
    expanded: boolean;
    open: () => void;
    close: () => void;
}

/**
 * Open and close state of a menu, plus the measuring of the element that opens it.
 */
export function useMxMenu(): MxMenuControl {
    const anchorRef = useRef<View>(null);
    const mounted = useRef(true);
    const [anchor, setAnchor] = useState<MenuRect | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const open = useCallback(() => {
        anchorRef.current?.measureInWindow((x, y, width, height) => {
            if (!mounted.current) {
                return;
            }
            setAnchor({ x, y, width, height });
            // Show the menu a frame later so it is placed using the anchor that was just measured
            requestAnimationFrame(() => {
                if (mounted.current) {
                    setVisible(true);
                }
            });
        });
    }, []);

    const close = useCallback(() => setVisible(false), []);

    return { anchorRef, anchor, visible, expanded: visible, open, close };
}
