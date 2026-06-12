/* Liquid glass SVG filter — injected once per page */
(function () {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
  svg.innerHTML =
    '<defs>' +
      '<filter id="glass-distortion" x="-5%" y="-5%" width="110%" height="110%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.012 0.008" numOctaves="1" seed="3" result="noise"/>' +
        '<feGaussianBlur in="noise" stdDeviation="2" result="softNoise"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="softNoise" scale="10" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>' +
    '</defs>';
  document.body.appendChild(svg);
})();
