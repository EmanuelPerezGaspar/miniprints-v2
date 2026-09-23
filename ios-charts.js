// MiniPrints — estilo de gráficas iOS para Chart.js (tipo Salud / Bolsa)
(function () {
  const IOS = window.IOS = {
    green:  '#30d158', blue:   '#0a84ff', orange: '#ff9f0a', red:    '#ff453a',
    purple: '#bf5af2', indigo: '#5e5ce6', teal:   '#64d2ff', yellow: '#ffd60a',
    label2: 'rgba(235,235,245,0.6)',
    label3: 'rgba(235,235,245,0.3)',
    grid:   'rgba(84,84,88,0.45)',
    font:   '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
  };

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

  if (!window.Chart) return;
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
  tt.backgroundColor = 'rgba(44,44,46,0.96)';
  tt.titleColor = '#fff';
  tt.bodyColor = 'rgba(235,235,245,0.85)';
  tt.borderColor = 'rgba(255,255,255,0.08)';
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
  D.elements.point.hoverBorderColor = '#1c1c1e';
})();
