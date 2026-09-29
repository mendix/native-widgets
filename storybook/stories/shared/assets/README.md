# Story assets

Placeholder images for the widget stories, bundled rather than fetched.

A `DynamicValue<NativeImage>` can hold a url, and a remote one is less code — but a story that
depends on the network shows an empty box on a device with no connection, which reads as a widget
bug rather than a missing image. These are `require`d instead, so a story renders the same offline.

| file              | what it is for                                                           |
| ----------------- | ------------------------------------------------------------------------ |
| `landscape.png`   | 640×400, for `resizeMode` and background comparisons — wider than tall   |
| `avatar.png`      | 200×200 square, for gallery/list rows                                    |
| `star-filled.png` | Rating's `icon` — the widget's own glyphicons need a font this app lacks |
| `star-empty.png`  | Rating's `emptyIcon`                                                     |

Generated with Pillow; nothing here is traced from copyrighted artwork. Regenerate at a different
size by editing the sizes above and drawing again — they are deliberately plain, since the point is
to show the widget's framing rather than the picture.
