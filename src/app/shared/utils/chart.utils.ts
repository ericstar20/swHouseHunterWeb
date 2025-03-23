import { Chart } from 'chart.js/auto';
import { ChartDataConfig } from '../models/chart-data.model';

/** ✅ Show Chart Popup */
export function showChartPopup(chartConfig: ChartDataConfig): void {
  const popupDiv = getOrCreatePopup();
  popupDiv.innerHTML = getPopupHeader();

  const canvas = createChartCanvas();
  popupDiv.appendChild(canvas);

  destroyExistingChart(canvas);
  createChart(canvas, chartConfig);

  if (chartConfig.extraHTML) {
    popupDiv.appendChild(createExtraContent(chartConfig.extraHTML));
  }

  positionPopup(popupDiv, chartConfig.position);
}

/** ✅ Get or Create Popup Element */
function getOrCreatePopup(): HTMLDivElement {
  let popupDiv = document.getElementById('chart-popup') as HTMLDivElement;
  if (!popupDiv) {
    popupDiv = document.createElement('div');
    popupDiv.id = 'chart-popup';
    Object.assign(popupDiv.style, getPopupStyles());
    document.body.appendChild(popupDiv);
    addCloseEvent(popupDiv);
  }
  return popupDiv;
}

/** ✅ Create Chart Canvas */
function createChartCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.id = 'dynamic-chart';
  Object.assign(canvas.style, { width: '300px', height: '200px' });
  return canvas;
}

/** ✅ Destroy Existing Chart if Present */
function destroyExistingChart(canvas: HTMLCanvasElement): void {
  const existingChart = Chart.getChart(canvas);
  if (existingChart) existingChart.destroy();
}

/** ✅ Create Chart */
function createChart(canvas: HTMLCanvasElement, config: ChartDataConfig): void {
  new Chart(canvas, {
    type: 'line',
    data: {
      labels: config.labels,
      datasets: config.datasets,
    },
    options: getChartOptions(config.title),
  });
}

/** ✅ Chart Options */
function getChartOptions(title: string) {
  return {
    responsive: false,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { font: { size: 14 }, color: '#333' } },
      title: {
        display: true,
        text: title,
        font: { size: 16 },
        color: '#000',
        padding: { top: 10, bottom: 10 },
      },
    },
    scales: {
      x: { ticks: { font: { size: 12 }, color: '#555' } },
      y: {
        ticks: {
          font: { size: 12 },
          color: '#555',
          callback: (value: number | string) => `$${value.toLocaleString()}`,
        },
      },
    },
  };
}

/** ✅ Create Extra Content (e.g., Crime Data) */
function createExtraContent(extraHTML: string): HTMLDivElement {
  const extraDiv = document.createElement('div');
  extraDiv.innerHTML = `
    <div style="margin-top: 10px; padding: 8px; background: #f8f8f8; border-radius: 5px;">
      <h5 style="margin: 0; padding-bottom: 5px;">Crime Data</h5>
      ${extraHTML}
    </div>
  `;
  return extraDiv;
}

/** ✅ Popup Header */
function getPopupHeader(): string {
  return `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <button id="close-chart-popup" style="
        background: red; color: white; border: none; padding: 2px 8px;
        cursor: pointer; border-radius: 3px; font-size: 14px;">
        X
      </button>
    </div>
  `;
}

/** ✅ Popup Styles */
function getPopupStyles(): Partial<CSSStyleDeclaration> {
  return {
    position: 'absolute',
    background: 'white',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    display: 'none',
    width: '320px',
    height: '250px',
    zIndex: '1000',
  };
}

/** ✅ Position Popup */
function positionPopup(
  popupDiv: HTMLDivElement,
  position: { x: number; y: number }
): void {
  Object.assign(popupDiv.style, {
    left: `${position.x + 10}px`,
    top: `${position.y - 50}px`,
    display: 'block',
  });
}

/** ✅ Add Close Event */
function addCloseEvent(popupDiv: HTMLDivElement): void {
  popupDiv.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).id === 'close-chart-popup') {
      popupDiv.style.display = 'none';
    }
  });
}
