export interface MenuRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface MenuSize {
    width: number;
    height: number;
}

/**
 * "overlap" puts the menu's top on the trigger's top, like a Material menu.
 * "below" puts it right under the trigger, like a drop-down.
 */
export type MenuPlacement = "overlap" | "below";

export interface MenuPositionInput {
    /** The trigger, in window coordinates */
    anchor: MenuRect;
    /** The measured size of the menu */
    menu: MenuSize;
    window: MenuSize;
    rtl?: boolean;
    placement?: MenuPlacement;
    /** Minimum distance to keep from the screen edges */
    indent?: number;
}

export const MENU_SCREEN_INDENT = 8;

/**
 * Where the menu goes, in physical window coordinates (x from the left edge, y from the top).
 *
 * Follows the rules react-native-material-menu applied, so existing menus land where they used to:
 * - left to right menus align with the trigger's left edge; when that would run off the right edge of the
 *   screen they align with the trigger's right edge instead
 * - right to left menus mirror that
 * - the menu always stays `indent` away from every screen edge
 */
export function computeMenuPosition(input: MenuPositionInput): { x: number; y: number } {
    const { anchor, menu, window, rtl = false, placement = "overlap", indent = MENU_SCREEN_INDENT } = input;
    const anchorRight = anchor.x + anchor.width;

    let x: number;
    if (rtl) {
        x = anchorRight - menu.width;
        if (x < indent) {
            x = anchor.x;
        }
    } else {
        x = anchor.x;
        if (x + menu.width > window.width - indent) {
            x = Math.min(window.width - indent, anchorRight) - menu.width;
        }
    }
    x = Math.max(indent, Math.min(x, window.width - indent - menu.width));

    let y = placement === "below" ? anchor.y + anchor.height : anchor.y;
    y = Math.max(indent, Math.min(y, window.height - indent - menu.height));

    return { x, y };
}

/**
 * React Native swaps `left` and `right` styles in right to left layouts, so a physical x has to be turned
 * into the value that `left` means there: the distance from the right edge.
 */
export function toStyleLeft(x: number, menuWidth: number, windowWidth: number, swapsInRtl: boolean): number {
    return swapsInRtl ? windowWidth - x - menuWidth : x;
}
