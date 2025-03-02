import { Chart } from 'chart.js/auto';

// **Interface for Chart Data Input**
export interface ChartDataConfig {
  title: string; // Title of the chart (e.g., ZIP Code, Category Name)
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
  }[];
  labels: string[]; // X-Axis Labels (Years)
  position: { x: number; y: number }; // Popup position
  containerId?: string; // Optional: Define a container for flexibility
}

// **Shared Chart Function**
export function showChartPopup(chartConfig: ChartDataConfig) {
  let popupDiv = document.getElementById('chart-popup') as HTMLDivElement;

  // **Create Popup if it Doesn't Exist**
  if (!popupDiv) {
    popupDiv = document.createElement('div');
    popupDiv.id = 'chart-popup';
    popupDiv.style.position = 'absolute';
    popupDiv.style.background = 'white';
    popupDiv.style.padding = '10px';
    popupDiv.style.borderRadius = '5px';
    popupDiv.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
    popupDiv.style.display = 'none';
    document.body.appendChild(popupDiv);
  }

  // **Clear previous content**
  popupDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <button id="close-chart-popup" style="
        background: red;
        color: white;
        border: none;
        padding: 2px 8px;
        cursor: pointer;
        border-radius: 3px;
        font-size: 14px;
      ">X</button>
    </div>
  `;

  // **Create Chart Canvas**
  const canvas = document.createElement('canvas');
  canvas.id = 'dynamic-chart';
  canvas.style.width = '300px';
  canvas.style.height = '200px';
  popupDiv.appendChild(canvas);

  // **Fix Popup Size**
  popupDiv.style.width = '320px';
  popupDiv.style.height = '250px';

  // **Destroy Previous Chart Instance**
  let existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }

  // **Create New Chart**
  new Chart(canvas, {
    type: 'line', // Default type, can be changed later
    data: {
      labels: chartConfig.labels,
      datasets: chartConfig.datasets,
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: { size: 14, weight: 'bold' },
            color: '#333',
          },
        },
        title: {
          display: true,
          text: chartConfig.title,
          font: { size: 16, weight: 'bold' },
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
            callback: (value) => `$${value.toLocaleString()}`,
          },
        },
      },
    },
  });

  // **Position the Popup**
  popupDiv.style.left = `${chartConfig.position.x + 10}px`;
  popupDiv.style.top = `${chartConfig.position.y - 50}px`;
  popupDiv.style.display = 'block';
  popupDiv.style.zIndex = '1000';

  console.log(
    '📌 Chart Popup Opened at:',
    popupDiv.style.left,
    popupDiv.style.top
  );

  // **Add Close Button Event Listener**
  document
    .getElementById('close-chart-popup')
    ?.addEventListener('click', () => {
      popupDiv.style.display = 'none';
    });
}
