# InfiniteLoop.js

Infinite looping scroll for full-screen sections. **Add one line to `<head>`. Done.**

```html
<script src="https://cdn.jsdelivr.net/gh/dev-af-edu/infinite-loop@1/infinite-scroll.js" defer></script>
```

Your page's `<section>` elements (or any `.section`) now loop forever:
Home → Services → Contact → Home → ... and upward too. No JavaScript to write.

## Built for everyone

- **Touch:** swipe works natively.
- **Mouse / trackpad:** wheel works natively. The native scrollbar is hidden (it would reveal the loop) and replaced by dot navigation.
- **Keyboard:** Arrow keys, PageUp/PageDown, Space, **Home** and **End** all work.
- **Dots:** a small clickable dot menu on the right shows where you are and jumps to any section by the shortest way. Dots are real buttons with labels for screen readers.
- Respects `prefers-reduced-motion`.

## How it works

No copies. The real sections are rotated in the DOM so your viewport always stays in the middle of the list. Your CSS (including `#id` selectors), ids and button click handlers keep working.

## Options (all optional)

| Want | Do |
|---|---|
| Turn auto mode off on a page | `<script src="..." data-auto="false" defer></script>` |
| Hide the dots | `<script src="..." data-dots="false" defer></script>` |
| Name a dot | `<section data-title="Menu">` (default: the section's first heading) |
| Choose the scrolling element yourself | add `data-infinite-loop` to it |

JavaScript API:

```js
const loop = InfiniteLoop.create({
  container: '#wrap',
  itemSelector: '.section',
  dots: true,
  hideScrollbar: true,
  onChange: (index, section) => {}
});
loop.scrollToIndex(2);  loop.next();  loop.prev();  loop.refresh();  loop.destroy();
```

## Notes
- Needs at least **3 sections**, each with a fixed height such as `100vh` or `100dvh`.
- Sections move in the DOM while you scroll, so avoid `<iframe>` or `<video>` inside them (moving them can reload them).
- `@1` in the URL always gives the latest 1.x version. Use `@1.1.0` to pin exactly.

MIT License
