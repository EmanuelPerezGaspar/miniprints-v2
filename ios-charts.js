// MiniPrints — estilo de gráficas iOS para Chart.js (tipo Salud / Bolsa)
// Toma los colores del tema activo desde IOSC (theme.js).
(function () {
  const IOS = window.IOS = {
    font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
  };

  function syncPalette() {
    const C = window.IOSC || {};
    Object.assign(IOS, {
      green: C.chartGreen, greenSoft: C.chartGreenSoft, greenRgb: C.chartGreenRgb,
      purple: C.chartPurple, blue: C.blue, orange: C.orange, red: C.red,
      text: C.text, label2: C.text2, label3: C.text3, grid: C.grid,
    });
  }

  // Degradado vertical que se desvanece, como el área bajo la línea en la app Bolsa
  IOS.gradient = function (rgb, top = 0.32) {
    return ctx => {
      const { ctx: c, chartArea } = ctx.chart;
      if (!chartArea) return 'transparent';
      const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, `rgba(${rgb},${top})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      return g;
    };
  };

  // Eje Y a la derecha, líneas punteadas y sin rejilla vertical
  IOS.scales = function (yTickCallback, extra = {}) {
    return {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: IOS.label2, font: { size: 12 }, maxRotation: 0, autoSkipPadding: 12 }, ...(extra.x || {}) },
      y: {
        position: 'right',
        grid: { color: IOS.grid, drawTicks: false },
        border: { display: false, dash: [3, 3] },
        ticks: { color: IOS.label2, font: { size: 12 }, padding: 8, maxTicksLimit: 5, callback: yTickCallback },
        ...(extra.y || {}),
      },
    };
  };

  function applyDefaults() {
    syncPalette();
    if (!window.Chart) return;
    const C = window.IOSC || {};
    const D = Chart.defaults;
    D.font.family = IOS.font;
    D.font.size = 12;
    D.color = IOS.label2;
    D.borderColor = IOS.grid;
    D.maintainAspectRatio = false;
    D.animation.duration = 650;
    D.animation.easing = 'easeOutQuart';
    D.interaction.mode = 'index';
    D.interaction.intersect = false;

    const tt = D.plugins.tooltip;
    tt.backgroundColor = C.tooltip;
    tt.titleColor = C.text;
    tt.bodyColor = C.tooltipText;
    tt.borderColor = C.tooltipBorder;
    tt.borderWidth = 0.5;
    tt.cornerRadius = 12;
    tt.padding = { x: 12, y: 9 };
    tt.caretSize = 0;
    tt.displayColors = false;
    tt.titleFont = { weight: '600', size: 13 };
    tt.bodyFont = { size: 13 };

    const lg = D.plugins.legend;
    lg.align = 'start';
    lg.labels.usePointStyle = true;
    lg.labels.pointStyle = 'circle';
    lg.labels.boxWidth = 8;
    lg.labels.boxHeight = 8;
    lg.labels.padding = 16;
    lg.labels.color = IOS.label2;
    lg.labels.font = { size: 13 };

    D.elements.bar.borderRadius = 8;
    D.elements.bar.borderSkipped = false;
    D.elements.line.tension = 0.35;
    D.elements.line.borderWidth = 2.5;
    D.elements.line.borderCapStyle = 'round';
    D.elements.point.radius = 0;
    D.elements.point.hoverRadius = 6;
    D.elements.point.hoverBorderWidth = 3;
    D.elements.point.hoverBorderColor = C.card;
  }

  applyDefaults();
  window.addEventListener('mp-theme-change', applyDefaults);
})();
