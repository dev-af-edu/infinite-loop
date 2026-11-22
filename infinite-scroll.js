/*!
 * InfiniteLoop.js v1.1.0
 * Infinite looping scroll for full-screen sections. One <script> line, no code needed.
 * Home -> Services -> Contact -> Home ... and upward too. No dependencies. MIT License.
 *
 * How it works: no clones. The real sections are rotated in the DOM so the viewport
 * always stays in the middle of the list. Your CSS, ids and event listeners keep working.
 *
 * Zero-config:  <script src=".../infinite-scroll.js" defer></script>
 * Options on the script tag:  data-auto="false"   data-dots="false"
 * Manual:       <div data-infinite-loop> ... </div>   or   InfiniteLoop.create({...})
 */
(function (global) {
  'use strict';
  var SCRIPT = (typeof document !== 'undefined') ? document.currentScript : null;
  var INTERACTIVE = 'a,button,input,textarea,select,summary,[contenteditable],[tabindex]:not(.il-root)';

  var CSS =
    '.il-root{outline:none;overflow-anchor:none;overscroll-behavior:contain}' +
    '.il-hide-sb{scrollbar-width:none;-ms-overflow-style:none}' +
    '.il-hide-sb::-webkit-scrollbar{display:none}' +
    '.il-dots{position:fixed;top:50%;right:8px;transform:translateY(-50%);display:flex;flex-direction:column;gap:2px;z-index:2147483000}' +
    '.il-dot{all:unset;box-sizing:border-box;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.il-dot::before{content:"";width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.55);box-shadow:0 0 0 1px rgba(0,0,0,.45);transition:transform .2s,background .2s}' +
    '.il-dot[aria-current="true"]::before{background:#fff;transform:scale(1.6)}' +
    '.il-dot:focus-visible::before{outline:2px solid #fff;outline-offset:3px}' +
    '@media (max-width:600px){.il-dots{right:0}}';

  var cssAdded = false;
  function addCss() {
    if (cssAdded) return;
    var s = document.createElement('style');
    s.setAttribute('data-il-style', '');
    s.textContent = CSS;
    document.head.appendChild(s);
    cssAdded = true;
  }

  var DEFAULTS = {
    container: null,            // element or selector (the scrolling element)
    itemSelector: ':scope > *', // which children are looped
    hideScrollbar: true,        // hide the native scrollbar (it would reveal the loop)
    dots: true,                 // show clickable dot navigation (works for touch, mouse, keyboard)
    onChange: null              // function(index, item) when the visible section changes
  };

  function InfiniteLoop(opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var el = typeof o.container === 'string' ? document.querySelector(o.container) : o.container;
    if (!el) throw new Error('InfiniteLoop: container not found');
    if (el.__infiniteLoop) return el.__infiniteLoop;

    this.el = el;
    this.opts = o;
    this.items = Array.prototype.slice.call(el.querySelectorAll(o.itemSelector));
    if (this.items.length < 3) throw new Error('InfiniteLoop: needs at least 3 sections');
    this.parent = this.items[0].parentNode;
    this.order = this.items.slice();
    this.active = -1;
    this._anchor = null;
    this._anim = null;
    this._raf = 0;

    addCss();
    el.classList.add('il-root');
    if (o.hideScrollbar) el.classList.add('il-hide-sb');
    if (getComputedStyle(el).overflowY === 'visible') el.style.overflowY = 'auto';
    if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); this._addedTabindex = true; }
    el.style.scrollBehavior = 'auto';

    var self = this;
    this._onScroll = function () {
      self._recenter();
      if (!self._raf) self._raf = requestAnimationFrame(function () { self._raf = 0; self._update(); });
    };
    this._cancel = function () { self._stopAnim(); };
    this._onPointerDown = function (e) {
      self._stopAnim();
      if (!e.target.closest || !e.target.closest(INTERACTIVE)) el.focus({ preventScroll: true });
    };
    this._onKey = function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('input,textarea,select,[contenteditable]')) return;
      if (e.key === 'Home') { e.preventDefault(); self.scrollToIndex(0); }
      else if (e.key === 'End') { e.preventDefault(); self.scrollToIndex(self.items.length - 1); }
      else self._stopAnim();
    };
    this._onResize = function () {
      var a = self._anchor;
      if (a) el.scrollTop = a.item.offsetTop + a.frac * a.item.offsetHeight;
      self._recenter();
      self._update();
    };

    el.addEventListener('scroll', this._onScroll, { passive: true });
    el.addEventListener('wheel', this._cancel, { passive: true });
    el.addEventListener('touchstart', this._cancel, { passive: true });
    el.addEventListener('pointerdown', this._onPointerDown);
    el.addEventListener('keydown', this._onKey);

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(el);
    } else {
      window.addEventListener('resize', this._onResize);
    }

    if (o.dots) this._buildDots();

    // Start with the first section at the top, then centre the list around it
    el.scrollTop = this.items[0].offsetTop;
    this._recenter();
    this._update();
    el.focus({ preventScroll: true });
    el.__infiniteLoop = this;
  }

  /* ---- core: keep the viewport in the middle of the list by rotating real nodes ---- */
  InfiniteLoop.prototype._recenter = function () {
    var el = this.el, order = this.order, parent = this.parent, guard = order.length * 2;
    while (guard-- > 0) {
      var maxH = 0, i;
      for (i = 0; i < order.length; i++) if (order[i].offsetHeight > maxH) maxH = order[i].offsetHeight;
      var mid = (el.scrollHeight - el.clientHeight) / 2, st = el.scrollTop, node, h;
      if (st < mid - maxH) {                       // too close to the top: move last section to the front
        node = order.pop(); h = node.offsetHeight;
        order.unshift(node);
        parent.insertBefore(node, order[1]);
        el.scrollTop = st + h;
      } else if (st > mid + maxH) {                // too close to the bottom: move first section to the end
        node = order.shift(); h = node.offsetHeight;
        var ref = order[order.length - 1].nextSibling;
        order.push(node);
        parent.insertBefore(node, ref);
        el.scrollTop = st - h;
      } else break;
    }
  };

  /* ---- active section tracking (dots, onChange, resize anchor) ---- */
  InfiniteLoop.prototype._update = function () {
    var el = this.el, st = el.scrollTop, c = st + el.clientHeight / 2, i, it, top, h;
    var idx = -1;
    for (i = 0; i < this.items.length; i++) {
      it = this.items[i]; top = it.offsetTop; h = it.offsetHeight;
      if (idx < 0 && c >= top && c < top + h) idx = i;
      if (st >= top && st < top + h) this._anchor = { item: it, frac: h ? (st - top) / h : 0 };
    }
    if (idx < 0 || idx === this.active) return;
    this.active = idx;
    if (this._dots) {
      for (i = 0; i < this._dots.length; i++) {
        if (i === idx) this._dots[i].setAttribute('aria-current', 'true');
        else this._dots[i].removeAttribute('aria-current');
      }
    }
    if (this.opts.onChange) this.opts.onChange(idx, this.items[idx]);
  };

  InfiniteLoop.prototype._label = function (item, i) {
    var t = item.getAttribute('data-title') || item.getAttribute('aria-label');
    if (!t) { var h = item.querySelector('h1,h2,h3'); if (h) t = h.textContent.trim(); }
    return t || ('Section ' + (i + 1));
  };

  InfiniteLoop.prototype._buildDots = function () {
    var self = this, nav = document.createElement('nav');
    nav.className = 'il-dots';
    nav.setAttribute('aria-label', 'Sections');
    this._dots = this.items.map(function (item, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'il-dot';
      b.setAttribute('aria-label', 'Go to ' + self._label(item, i));
      b.title = self._label(item, i);
      b.addEventListener('click', function () { self.scrollToIndex(i); self.el.focus({ preventScroll: true }); });
      nav.appendChild(b);
      return b;
    });
    document.body.appendChild(nav);
    this._nav = nav;
  };

  /* ---- navigation ---- */
  InfiniteLoop.prototype._stopAnim = function () {
    if (this._anim) { cancelAnimationFrame(this._anim); this._anim = null; }
  };

  /** Scroll to the nth original section (0-based) by the shortest way round. */
  InfiniteLoop.prototype.scrollToIndex = function (i, instant) {
    var n = this.items.length, el = this.el, self = this;
    var target = this.items[((i % n) + n) % n];
    this._stopAnim();
    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (instant || reduce) { el.scrollTop = target.offsetTop; this._recenter(); this._update(); return; }
    (function step() {
      var dist = target.offsetTop - el.scrollTop;
      if (Math.abs(dist) <= 1) { el.scrollTop = target.offsetTop; self._anim = null; return; }
      var move = dist * 0.16;
      if (Math.abs(move) < 3) move = dist > 0 ? Math.min(3, dist) : Math.max(-3, dist);
      el.scrollTop += move;
      self._recenter();
      self._anim = requestAnimationFrame(step);
    })();
  };

  InfiniteLoop.prototype.next = function () { this.scrollToIndex(this.active + 1); };
  InfiniteLoop.prototype.prev = function () { this.scrollToIndex(this.active - 1); };
  InfiniteLoop.prototype.refresh = function () { this._onResize(); };

  InfiniteLoop.prototype.destroy = function () {
    var el = this.el, i;
    this._stopAnim();
    el.removeEventListener('scroll', this._onScroll);
    el.removeEventListener('wheel', this._cancel);
    el.removeEventListener('touchstart', this._cancel);
    el.removeEventListener('pointerdown', this._onPointerDown);
    el.removeEventListener('keydown', this._onKey);
    if (this._ro) this._ro.disconnect(); else window.removeEventListener('resize', this._onResize);
    // put sections back in their original order
    var ref = this.order[this.order.length - 1].nextSibling;
    for (i = 0; i < this.items.length; i++) this.parent.insertBefore(this.items[i], ref);
    if (this._nav) this._nav.remove();
    el.classList.remove('il-root', 'il-hide-sb');
    if (this._addedTabindex) el.removeAttribute('tabindex');
    el.scrollTop = 0;
    delete el.__infiniteLoop;
  };

  /* ---- public API + zero-config start ---- */
  var api = {
    version: '1.1.0',
    create: function (opts) { return new InfiniteLoop(opts); },
    autoInit: function () {
      var dots = !(SCRIPT && SCRIPT.getAttribute('data-dots') === 'false');
      try {
        // 1) Manual mode: any element marked data-infinite-loop
        var explicit = document.querySelectorAll('[data-infinite-loop]');
        if (explicit.length) {
          Array.prototype.forEach.call(explicit, function (el) {
            api.create({ container: el, itemSelector: el.getAttribute('data-item-selector') || ':scope > *', dots: dots });
          });
          return;
        }
        // 2) Zero-config mode: only the <script> link. Finds <section> / .section by itself.
        if (SCRIPT && SCRIPT.getAttribute('data-auto') === 'false') return;
        var first = document.querySelector('section, .section');
        if (!first) return;
        var parent = first.parentElement, container;
        if (parent === document.body) {
          container = document.createElement('div');
          Array.prototype.slice.call(document.body.childNodes).forEach(function (n) {
            if (n.nodeType === 1 && /^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(n.tagName)) return;
            container.appendChild(n);
          });
          document.body.insertBefore(container, document.body.firstChild);
        } else {
          container = parent;
        }
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        document.body.style.overflow = 'hidden';
        container.style.height = '100vh';
        container.style.height = '100dvh'; // ignored by browsers that do not know dvh
        container.style.overflowY = 'auto';
        api.create({ container: container, itemSelector: ':scope > section, :scope > .section', dots: dots });
      } catch (err) {
        if (global.console) console.warn(err.message);
      }
    }
  };

  global.InfiniteLoop = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', api.autoInit);
    else api.autoInit();
  }
})(typeof window !== 'undefined' ? window : this);
