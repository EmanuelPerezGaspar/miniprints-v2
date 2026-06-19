/* GlassSurface displacement-map filter for #navbar — vanilla JS port of React Bits GlassSurface */
(function () {
  const FILTER_ID = 'glass-surface-nav';
  const RED_GRAD  = 'gsn-red';
  const BLUE_GRAD = 'gsn-blue';

  const P = {
    borderRadius:    18,
    borderWidth:     0.07,
    brightness:      50,
    opacity:         0.93,
    blur:            11,
    distortionScale: -180,
    redOffset:       0,
    greenOffset:     10,
    blueOffset:      20,
    xChannel:       'R',
    yChannel:       'G',
    mixBlendMode:   'difference',
  };

  function makeDMap(w, h) {
    const edge = Math.min(w, h) * (P.borderWidth * 0.5);
    const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="${RED_GRAD}" x1="100%" y1="0%" x2="0%" y2="0%">
    <stop offset="0%" stop-color="#0000"/>
    <stop offset="100%" stop-color="red"/>
  </linearGradient>
  <linearGradient id="${BLUE_GRAD}" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#0000"/>
    <stop offset="100%" stop-color="blue"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
<rect x="0" y="0" width="${w}" height="${h}" rx="${P.borderRadius}" fill="url(#${RED_GRAD})"/>
<rect x="0" y="0" width="${w}" height="${h}" rx="${P.borderRadius}" fill="url(#${BLUE_GRAD})" style="mix-blend-mode:${P.mixBlendMode}"/>
<rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${P.borderRadius}" fill="hsl(0 0% ${P.brightness}% / ${P.opacity})" style="filter:blur(${P.blur}px)"/>
</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e;
  }

  const feImg = svgEl('feImage', {
    x: '0', y: '0', width: '100%', height: '100%',
    preserveAspectRatio: 'none', result: 'map'
  });

  const redD  = svgEl('feDisplacementMap', { in:'SourceGraphic', in2:'map', scale: P.distortionScale + P.redOffset,   xChannelSelector:P.xChannel, yChannelSelector:P.yChannel, result:'dispRed' });
  const redM  = svgEl('feColorMatrix',     { in:'dispRed',   type:'matrix', values:'1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result:'red' });
  const grnD  = svgEl('feDisplacementMap', { in:'SourceGraphic', in2:'map', scale: P.distortionScale + P.greenOffset, xChannelSelector:P.xChannel, yChannelSelector:P.yChannel, result:'dispGreen' });
  const grnM  = svgEl('feColorMatrix',     { in:'dispGreen', type:'matrix', values:'0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', result:'green' });
  const bluD  = svgEl('feDisplacementMap', { in:'SourceGraphic', in2:'map', scale: P.distortionScale + P.blueOffset,  xChannelSelector:P.xChannel, yChannelSelector:P.yChannel, result:'dispBlue' });
  const bluM  = svgEl('feColorMatrix',     { in:'dispBlue',  type:'matrix', values:'0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', result:'blue' });
  const blRG  = svgEl('feBlend',           { in:'red',  in2:'green', mode:'screen', result:'rg' });
  const blRGB = svgEl('feBlend',           { in:'rg',   in2:'blue',  mode:'screen', result:'output' });
  const fBlur = svgEl('feGaussianBlur',    { in:'output', stdDeviation:'0.7' });

  const filter = svgEl('filter', {
    id: FILTER_ID,
    colorInterpolationFilters: 'sRGB',
    x: '-2%', y: '-10%', width: '104%', height: '120%'
  });
  filter.append(feImg, redD, redM, grnD, grnM, bluD, bluM, blRG, blRGB, fBlur);

  const containerSvg = svgEl('svg', { 'aria-hidden': 'true' });
  containerSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
  const defs = document.createElementNS(NS, 'defs');
  defs.appendChild(filter);
  containerSvg.appendChild(defs);
  document.body.appendChild(containerSvg);

  function update() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    const r = nav.getBoundingClientRect();
    feImg.setAttribute('href', makeDMap(r.width || 1000, r.height || 54));
  }

  function init() {
    update();
    const nav = document.getElementById('navbar');
    if (nav) new ResizeObserver(() => setTimeout(update, 0)).observe(nav);
    window.addEventListener('resize', update);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
