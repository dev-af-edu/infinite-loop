# InfiniteLoop.js

Infinite looping scroll for your website. **Add one line to `<head>`. Done.**

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/infinite-loop@1/infinite-scroll.js" defer></script>
```

Your page's `<section>` elements (or any `.section`) now loop forever:
Home → Services → Contact → Home → Services → ... and upward too.

No JavaScript to write. Use the same line on all your pages.

## Options (all optional)

| Want | Do |
|---|---|
| Turn auto mode off on a page | `<script src="..." data-auto="false" defer></script>` |
| Choose the scrolling element yourself | add `data-infinite-loop` to it |
| Control from JS | `InfiniteLoop.create({ container: '#wrap', itemSelector: '.section', onLoop: dir => {}, onProgress: r => {} })` |

JS API: `scrollToIndex(i)`, `refresh()`, `destroy()`.

## Notes
- Each section should be `height: 100vh` (or any fixed height).
- Sections are cloned once above and once below. Clones have no `id`s, and click handlers are not copied, so use event delegation.
- `@1` in the URL always gives the latest 1.x version. Use `@1.0.0` to pin exactly.
- Add `.min` for a smaller file: `.../infinite-scroll.min.js` (jsDelivr makes it automatically).

MIT License
