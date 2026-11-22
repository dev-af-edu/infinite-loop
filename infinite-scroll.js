/*!
 * InfiniteLoop.js v1.0.0
 * Seamless infinite looping scroll for sections (Home -> Menu -> About -> Contact -> Home ...)
 * Works downward AND upward. No dependencies. MIT License.
 *
 * Usage (auto):   <div data-infinite-loop> <section>..</section> ... </div>
 * Usage (JS):     InfiniteLoop.create({ container: '#wrap', itemSelector: '.section' })
 */
(function (global) {
  'use strict';
  var SCRIPT = (typeof document !== 'undefined') ? document.currentScript : null;

  var DEFAULTS = {
    container: null,          // element or selector (the scrolling element)
    itemSelector: ':scope > *', // which children are looped
    hideScrollbar: true,      // hide native scrollbar (jump would be visible)
    onLoop: null,             // function(direction) -> 'down' | 'up'
    onProgress: null          // function(ratio 0..1) -> position inside one loop
  };

  function InfiniteLoop(opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var el = typeof o.container === 'string' ? document.querySelector(o.container) : o.container;
    if (!el) throw new Error('InfiniteLoop: container not found');
    if (el.__infiniteLoop) return el.__infiniteLoop;

    this.el = el;
    this.opts = o;
    this.items = Array.prototype.slice.call(el.querySelectorAll(o.itemSelector));
    if (!this.items.length) throw new Error('InfiniteLoop: no items found');

    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    if (getComputedStyle(el).overflowY === 'visible') el.style.overflowY = 'auto';
    if (o.hideScrollbar) {
      el.style.scrollbarWidth = 'none';
      el.style.msOverflowStyle = 'none';
      this._style = document.createElement('style');
      this._style.textContent = '[data-il-id="' + (this._id = 'il' + Math.random().toString(36).slice(2)) + '"]::-webkit-scrollbar{display:none}';
      document.head.appendChild(this._style);
      el.setAttribute('data-il-id', this._id);
    }

    this._build();
    this._loopH = 0;
    this._busy = false;
    this._onScroll = this._onScroll.bind(this);
    this._measure = this._measure.bind(this);

    this._measure();
    el.scrollTop = this._loopH; // start in the middle copy
    el.addEventListener('scroll', this._onScroll, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._measure);
      this._ro.observe(el);
      this.items.forEach(function (i) { this._ro.observe(i); }, this);
    } else {
      window.addEventListener('resize', this._measure);
    }
    el.__infiniteLoop = this;
  }

  InfiniteLoop.prototype._clone = function () {
    return this.items.map(function (item) {
      var c = item.cloneNode(true);
      c.setAttribute('data-il-clone', 'true');
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('id');
      Array.prototype.forEach.call(c.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
      Array.prototype.forEach.call(c.querySelectorAll('a,button,input,select,textarea,[tabindex]'), function (n) { n.setAttribute('tabindex', '-1'); });
      return c;
    });
  };

  InfiniteLoop.prototype._build = function () {
    var first = this.items[0], last = this.items[this.items.length - 1];
    this._before = this._clone();
    this._after = this._clone();
    this._before.forEach(function (c) { first.parentNode.insertBefore(c, first); });
    var ref = last.nextSibling;
    this._after.forEach(function (c) { last.parentNode.insertBefore(c, ref); });
  };

  InfiniteLoop.prototype._measure = function () {
    var ratio = this._loopH ? (this.el.scrollTop - this._loopH) / this._loopH : 0;
    this._loopH = this._after[0].offsetTop - this.items[0].offsetTop;
    if (this._loopH > 0 && isFinite(ratio)) this.el.scrollTop = this._loopH + ratio * this._loopH;
  };

  InfiniteLoop.prototype._onScroll = function () {
    var el = this.el, L = this._loopH, st = el.scrollTop, o = this.opts;
    if (!L) return;
    if (st >= 2 * L) {
      el.scrollTop = st - L;
      if (o.onLoop) o.onLoop('down');
    } else if (st < L) {
      el.scrollTop = st + L;
      if (o.onLoop) o.onLoop('up');
    }
    if (o.onProgress) o.onProgress(((el.scrollTop - L) % L + L) % L / L);
  };

  /** Scroll to the nth original item (0-based). */
  InfiniteLoop.prototype.scrollToIndex = function (i, behavior) {
    var n = this.items.length;
    var target = this.items[((i % n) + n) % n];
    this.el.scrollTo({ top: target.offsetTop, behavior: behavior || 'smooth' });
  };

  InfiniteLoop.prototype.refresh = function () { this._measure(); };

  InfiniteLoop.prototype.destroy = function () {
    var el = this.el;
    el.removeEventListener('scroll', this._onScroll);
    if (this._ro) this._ro.disconnect(); else window.removeEventListener('resize', this._measure);
    this._before.concat(this._after).forEach(function (c) { c.remove(); });
    if (this._style) this._style.remove();
    el.scrollTop = 0;
    delete el.__infiniteLoop;
  };

  var api = {
    version: '1.0.0',
    create: function (opts) { return new InfiniteLoop(opts); },
    autoInit: function () {
      // 1) Manual mode: any element marked data-infinite-loop
      var explicit = document.querySelectorAll('[data-infinite-loop]');
      if (explicit.length) {
        Array.prototype.forEach.call(explicit, function (el) {
          var sel = el.getAttribute('data-item-selector');
          api.create({ container: el, itemSelector: sel || ':scope > *' });
        });
        return;
      }
      // 2) Zero-config mode: just the <script> link. Finds <section>/.section automatically.
      //    Turn off with: <script src="..." data-auto="false">
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
      container.style.overflowY = 'auto';
      api.create({ container: container, itemSelector: ':scope > section, :scope > .section' });
    }
  };

  global.InfiniteLoop = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  // Auto-initialise any [data-infinite-loop] element once the page is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', api.autoInit);
    else api.autoInit();
  }
})(typeof window !== 'undefined' ? window : this);
