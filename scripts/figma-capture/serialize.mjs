// Freeze a rendered page into a self-contained HTML document: every element
// carries its computed style inline (so media queries / class CSS no longer
// matter), pseudo-elements become spans, canvases/videos become screenshots,
// iframes are inlined, and fonts/images become data URIs.

// ---------- in-page phase 1: build the frozen DOM, return URLs to inline ----------
export const phase1 = async ({ shots }) => {
  const NO_EMIT = /^(transition|animation|cursor|will-change|-webkit-tap-highlight|pointer-events|user-select|-webkit-user|caret-color|scroll-|overscroll|touch-action|content-visibility|contain|view-transition|interpolate-size|text-size-adjust|-webkit-text-size-adjust|speak|app-region|math-|ruby-|-webkit-locale|-webkit-rtl|-webkit-highlight|field-sizing|anchor|position-anchor|position-try|position-visibility|inset-area|timeline|scroll-timeline|view-timeline|offset|container|zoom|forced-color|print-color|reading-flow|reading-order|interactivity|hyphenate|-webkit-line-break)/;
  const LOGICAL = /^(border-(block|inline)|inline-size|block-size|min-(block|inline)-size|max-(block|inline)-size|margin-(block|inline)|padding-(block|inline)|inset-(block|inline)|scroll-(margin|padding)-(block|inline)|contain-intrinsic-(block|inline)|overflow-(block|inline)|-webkit-text-decorations-in-effect|column-rule-color|outline-color|text-emphasis-color|-webkit-text-stroke-color|row-rule-color)/;
  const INHERITED = new Set(['color','font-family','font-size','font-style','font-weight','font-stretch','font-variant','font-variant-ligatures','font-variant-caps','font-variant-numeric','font-variant-east-asian','font-variant-alternates','font-variant-position','font-feature-settings','font-variation-settings','font-kerning','font-optical-sizing','font-synthesis-weight','font-synthesis-style','font-synthesis-small-caps','font-size-adjust','font-palette','line-height','letter-spacing','word-spacing','text-align','text-align-last','text-indent','text-transform','text-shadow','text-rendering','text-wrap','text-wrap-mode','text-wrap-style','text-underline-position','text-underline-offset','text-emphasis-color','text-emphasis-position','text-emphasis-style','text-orientation','white-space','white-space-collapse','word-break','overflow-wrap','line-break','hyphens','tab-size','direction','writing-mode','visibility','list-style-type','list-style-position','list-style-image','quotes','border-collapse','border-spacing','caption-side','empty-cells','fill','fill-opacity','fill-rule','stroke','stroke-width','stroke-opacity','stroke-linecap','stroke-linejoin','stroke-dasharray','stroke-dashoffset','stroke-miterlimit','paint-order','color-scheme','image-rendering','-webkit-font-smoothing','-webkit-text-fill-color','-webkit-text-stroke-color','-webkit-text-stroke-width','-webkit-text-security','orphans','widows','color-interpolation','color-rendering','shape-rendering','text-anchor','dominant-baseline','clip-rule','marker-start','marker-mid','marker-end','font-display','text-spacing-trim','text-autospace','dynamic-range-limit']);

  // defaults per tag from a blank document
  // baseline = UA defaults inside a style-isolated shadow root (works in sandboxed frames too)
  const df = document.createElement('div');
  df.style.cssText = 'all:initial;position:absolute;left:-99999px;top:0;width:0;height:0;overflow:hidden';
  document.documentElement.appendChild(df);
  const root = df.attachShadow({ mode: 'open' });
  root.innerHTML = '<style>:host{all:initial}</style><div id="b"></div>';
  const ddoc = document;
  const dbody = root.getElementById('b');
  const defCache = new Map();
  const defaults = (el) => {
    const key = (el.namespaceURI || '') + '|' + el.localName + '|' + (el.getAttribute('type') || '') + '|' + (el.hasAttribute('href') ? 'h' : '');
    if (defCache.has(key)) return defCache.get(key);
    const d = el.namespaceURI === 'http://www.w3.org/2000/svg'
      ? ddoc.createElementNS(el.namespaceURI, el.localName)
      : ddoc.createElement(el.localName);
    if (el.hasAttribute('href') && el.namespaceURI !== 'http://www.w3.org/2000/svg') d.setAttribute('href', '#x');
    if (el.hasAttribute('type')) d.setAttribute('type', el.getAttribute('type'));
    let host = dbody;
    if (el.namespaceURI === 'http://www.w3.org/2000/svg' && el.localName !== 'svg') {
      host = ddoc.createElementNS(el.namespaceURI, 'svg'); dbody.appendChild(host);
    }
    host.appendChild(d);
    const cs = getComputedStyle(d);
    const o = {};
    for (let i = 0; i < cs.length; i++) o[cs[i]] = cs.getPropertyValue(cs[i]);
    defCache.set(key, o);
    return o;
  };

  const urls = new Set();
  const noteUrls = (v) => { for (const m of v.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) if (/^https?:/.test(m[1])) urls.add(m[1]); };

  const styleText = (cs, def, parentCs, el, extra = {}) => {
    const out = [];
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      if (NO_EMIT.test(p) || p.startsWith('--') || LOGICAL.test(p)) continue;
      let v = cs.getPropertyValue(p);
      if (p in extra) continue;
      const inh = INHERITED.has(p);
      const differsDef = def[p] !== v;
      const differsParent = parentCs ? parentCs.getPropertyValue(p) !== v : true;
      if (inh ? (differsParent || differsDef) : differsDef) {
        if (v.includes('url(')) noteUrls(v);
        out.push(p + ':' + v);
      }
    }
    // the baseline host is 0x0, so sizes that happen to be 0px must still be written
    const disp = cs.getPropertyValue('display');
    if (disp !== 'inline' && disp !== 'contents' && el && el.namespaceURI !== 'http://www.w3.org/2000/svg') {
      for (const p of ['width', 'height']) if (!(p in extra) && !out.some((x) => x.startsWith(p + ':'))) out.push(p + ':' + cs.getPropertyValue(p));
    }
    // UA margins/paddings are em-relative (p, h*, ul, figure...), so write them explicitly
    if (el && el.namespaceURI !== 'http://www.w3.org/2000/svg') for (const p of ['margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left']) {
      if (!(p in extra) && !out.some((x) => x.startsWith(p + ':'))) out.push(p + ':' + cs.getPropertyValue(p));
    }
    // 0x0 baseline: a centred origin reads "0px 0px", so write the origin whenever it matters
    for (const [prop, origin] of [['transform', 'transform-origin'], ['perspective', 'perspective-origin']]) {
      const v = cs.getPropertyValue(prop);
      if (v && v !== 'none' && !out.some((x) => x.startsWith(origin + ':'))) out.push(origin + ':' + cs.getPropertyValue(origin));
    }
    if ((cs.getPropertyValue('translate') !== 'none' || cs.getPropertyValue('scale') !== 'none' || cs.getPropertyValue('rotate') !== 'none') && !out.some((x) => x.startsWith('transform-origin:'))) out.push('transform-origin:' + cs.getPropertyValue('transform-origin'));
    // a border/outline style without a width would fall back to "medium"
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const st = cs.getPropertyValue(`border-${side}-style`);
      if (st !== 'none' && st !== 'hidden') out.push(`border-${side}-width:` + cs.getPropertyValue(`border-${side}-width`));
    }
    if (!['none'].includes(cs.getPropertyValue('outline-style'))) out.push('outline-width:' + cs.getPropertyValue('outline-width'));
    for (const [p, v] of Object.entries(extra)) out.push(p + ':' + v);
    return out.join(';');
  };

  const DOC_H = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const fixedNodes = [];
  const SKIP = new Set(['SCRIPT','NOSCRIPT','TEMPLATE','LINK','META','STYLE','TITLE','HEAD','BASE']);
  const SVGNS = 'http://www.w3.org/2000/svg';

  const pseudo = (el, which, parentCs) => {
    const cs = getComputedStyle(el, which);
    const c = cs.getPropertyValue('content');
    if (!c || c === 'none' || c === 'normal') return null;
    if (cs.display === 'none') return null;
    const span = document.createElement('span');
    span.setAttribute('data-pseudo', which.slice(2));
    let text = '';
    const m = c.match(/^"((?:[^"\\]|\\.)*)"$/);
    if (m) text = m[1].replace(/\\([0-9a-fA-F]{1,6}) ?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
    else if (/counter\(/.test(c)) {
      // resolve the common "numbered steps" case: position among same-tag siblings
      let i = 1; for (let x = el.previousElementSibling; x; x = x.previousElementSibling) if (x.tagName === el.tagName) i++;
      const lit = c.match(/"((?:[^"\\]|\\.)*)"/g) || [];
      text = c.replace(/counter\([^)]*\)/g, String(i)).replace(/"((?:[^"\\]|\\.)*)"/g, '$1').replace(/\s+/g, '');
      if (lit.length) text = c.split(/(counter\([^)]*\)|"(?:[^"\\]|\\.)*")/).filter(Boolean).map((t) => t.startsWith('counter(') ? String(i) : t.startsWith('"') ? t.slice(1, -1) : '').join('');
    }
    else if (c.includes('url(')) noteUrls(c);
    span.textContent = text;
    span.setAttribute('style', styleText(cs, defaults(span), parentCs, el));
    return span;
  };

  const build = (el, parentCs) => {
    if (el.nodeType === 3) return document.createTextNode(el.data);
    if (el.nodeType !== 1) return null;
    if (SKIP.has(el.tagName) || el === df) return null;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return null;
    const isSvg = el.namespaceURI === SVGNS;
    const shotId = el.getAttribute('data-cap-shot');
    if (shotId && shots[shotId]) {
      const img = document.createElement('img');
      img.setAttribute('src', shots[shotId]);
      img.setAttribute('data-from', el.localName);
      const extra = { width: cs.width, height: cs.height, 'object-fit': 'fill' };
      img.setAttribute('style', styleText(cs, defaults(el), parentCs, el, extra));
      return img;
    }
    if (el.tagName === 'IFRAME') {
      const div = document.createElement('div');
      div.setAttribute('data-cap-frame', el.getAttribute('data-cap-frame') || '');
      div.setAttribute('style', styleText(cs, defaults(el), parentCs, el, { width: cs.width, height: cs.height, overflow: 'hidden', position: cs.position === 'static' ? 'relative' : cs.position }));
      return div;
    }
    const n = isSvg ? document.createElementNS(SVGNS, el.localName) : document.createElement(el.localName === 'html' ? 'div' : el.localName);
    for (const a of el.attributes) {
      if (a.name === 'style' || a.name.startsWith('on') || a.name === 'srcset' || a.name === 'sizes' || a.name === 'loading') continue;
      try { isSvg && a.namespaceURI ? n.setAttributeNS(a.namespaceURI, a.name, a.value) : n.setAttribute(a.name, a.value); } catch {}
    }
    if (el.tagName === 'IMG') { const s = el.currentSrc || el.src; n.setAttribute('src', s); if (/^https?:/.test(s)) urls.add(s); }
    if (isSvg && (el.localName === 'image' || el.localName === 'use')) {
      const h = el.getAttribute('href') || el.getAttribute('xlink:href');
      if (h && el.localName === 'image') { const abs = new URL(h, location.href).href; n.setAttribute('href', abs); urls.add(abs); }
    }
    if (el.tagName === 'INPUT') { if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) n.setAttribute('checked', ''); } else n.setAttribute('value', el.value); }
    if (el.tagName === 'TEXTAREA') n.textContent = el.value;
    if (el.tagName === 'SELECT') {}
    if (el.tagName === 'A') n.removeAttribute('target');
    let extra = {};
    if (cs.position === 'fixed') {
      const r = el.getBoundingClientRect();
      const fullH = r.height >= innerHeight - 1 && r.top <= 0 ? DOC_H : r.height;
      extra = { position: 'absolute', top: (r.top + scrollY) + 'px', left: (r.left + scrollX) + 'px', right: 'auto', bottom: 'auto', width: r.width + 'px', height: fullH + 'px', 'z-index': cs.zIndex === 'auto' ? '50' : cs.zIndex };
    } else if (cs.position === 'sticky') {
      const r1 = el.getBoundingClientRect();
      const prev = el.style.getPropertyValue('position'), prio = el.style.getPropertyPriority('position');
      el.style.setProperty('position', 'static', 'important');
      const r0 = el.getBoundingClientRect();
      el.style.setProperty('position', prev, prio);
      extra = { position: 'relative', top: (r1.top - r0.top) + 'px', left: (r1.left - r0.left) + 'px', bottom: 'auto', right: 'auto' };
    }
    // scroll containers: show content at current scroll state
    n.setAttribute('style', styleText(cs, defaults(el), cs.position === 'fixed' ? null : parentCs, el, extra));
    const b = !isSvg && pseudo(el, '::before', cs);
    if (b) n.appendChild(b);
    const kids = el.tagName === 'SELECT' ? [] : el.childNodes;
    for (const c of kids) { const k = build(c, cs); if (k) n.appendChild(k); }
    if (el.tagName === 'SELECT') n.textContent = '';
    if (el.tagName === 'SELECT' && el.selectedOptions[0]) { const o = document.createElement('option'); o.textContent = el.selectedOptions[0].textContent; n.appendChild(o); }
    const a = !isSvg && pseudo(el, '::after', cs);
    if (a) n.appendChild(a);
    // bake a scrolled container's offset into its children (static HTML has no scroll state)
    if (!isSvg && (el.scrollTop || el.scrollLeft) && cs.overflow !== 'visible') {
      const sh = `translate(${-el.scrollLeft}px, ${-el.scrollTop}px)`;
      for (const k of n.children) {
        const st = k.getAttribute('style') || '';
        const m = st.match(/(?:^|;)transform:([^;]*)/);
        if (m && m[1].trim() !== 'none') k.setAttribute('style', st.replace(/(^|;)transform:([^;]*)/, `$1transform:${sh} $2`));
        else k.setAttribute('style', st + `;transform:${sh}`);
      }
    }
    if (cs.position === 'fixed') { fixedNodes.push(n); return document.createComment('fixed'); }
    return n;
  };

  const html = document.documentElement, body = document.body;
  const htmlCs = getComputedStyle(html);
  const bodyNode = build(body, htmlCs);
  for (const f of fixedNodes) bodyNode.appendChild(f);
  const W = Math.max(html.scrollWidth, innerWidth);
  // page background (html wins if body is transparent)
  const bg = getComputedStyle(body).backgroundColor;
  const pageBg = bg && bg !== 'rgba(0, 0, 0, 0)' ? bg : htmlCs.backgroundColor;

  // fonts actually used
  const families = new Set();
  for (const el of document.querySelectorAll('*')) for (const f of getComputedStyle(el).fontFamily.split(',')) families.add(f.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const faces = [];
  const walkRules = (rules, base) => {
    for (const r of rules) {
      if (r.type === 5) {
        const fam = r.style.getPropertyValue('font-family').trim().replace(/^["']|["']$/g, '').toLowerCase();
        if (!families.has(fam)) continue;
        let t = r.cssText.replace(/url\(\s*["']?([^"')]+)["']?\s*\)/g, (_, u) => { const abs = new URL(u, base).href; if (/^https?:/.test(abs)) urls.add(abs); return `url("${abs}")`; });
        faces.push(t);
      } else if (r.cssRules) walkRules(r.cssRules, base);
    }
  };
  for (const s of document.styleSheets) { try { walkRules(s.cssRules, s.href || location.href); } catch {} }

  df.remove();
  const xsheets = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href).filter((h) => new URL(h).origin !== location.origin);
  window.__cap = { bodyNode, faces, W, H: Math.max(html.scrollHeight, body.scrollHeight), pageBg, htmlStyle: '' };
  return { urls: [...urls], xsheets, families: [...families] };
};

// ---------- in-page phase 2: substitute data URIs + inner frames, return HTML ----------
export const phase2 = ({ map, frames, title, asFragment, extraFaces = [] }) => {
  const { bodyNode, faces, W, H, pageBg } = window.__cap;
  const sub = (s) => s.replace(/url\(\s*(?:"|&quot;|')?([^"')&]+?)(?:"|&quot;|')?\s*\)/g, (m, u) => map[u] ? `url("${map[u]}")` : m);
  for (const n of bodyNode.querySelectorAll('[style]')) { const s = n.getAttribute('style'); if (s.includes('url(')) n.setAttribute('style', sub(s)); }
  if (bodyNode.getAttribute('style')?.includes('url(')) bodyNode.setAttribute('style', sub(bodyNode.getAttribute('style')));
  for (const n of bodyNode.querySelectorAll('img[src]')) { const u = n.getAttribute('src'); if (map[u]) n.setAttribute('src', map[u]); }
  for (const n of bodyNode.querySelectorAll('image')) { const u = n.getAttribute('href'); if (map[u]) n.setAttribute('href', map[u]); }
  // negative z-index layers paint under their siblings; put them first so DOM order (Figma layer order) agrees
  for (const n of [...bodyNode.querySelectorAll('[style*="z-index:-"]')]) { if (n.parentNode) n.parentNode.insertBefore(n, n.parentNode.firstChild); }
  for (const n of bodyNode.querySelectorAll('[data-cap-frame]')) { const f = frames[n.getAttribute('data-cap-frame')]; if (f) n.innerHTML = f.body; }
  let allFaces = faces.map(sub).concat(extraFaces);
  for (const f of Object.values(frames)) allFaces = allFaces.concat(f.faces);
  allFaces = [...new Set(allFaces)];
  if (asFragment) {
    // body becomes a div so it can live inside a parent document
    const wrap = document.createElement('div');
    wrap.setAttribute('style', bodyNode.getAttribute('style') + `;width:${W}px;min-height:${H}px;margin:0;background-color:${pageBg}`);
    for (const c of [...bodyNode.childNodes]) wrap.appendChild(c);
    return { body: wrap.outerHTML, faces: allFaces };
  }
  const bodyStyle = (bodyNode.getAttribute('style') || '') + `;margin:0;width:${W}px;min-height:${H}px;background-color:${pageBg};position:relative`;
  bodyNode.setAttribute('style', bodyStyle);
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html lang="en" style="margin:0;width:${W}px;background-color:${pageBg}"><head><meta charset="utf-8"><meta name="viewport" content="width=${W}"><title>${esc(title)}</title><style>${allFaces.join('\n')}</style></head>${bodyNode.outerHTML}</html>`;
};
