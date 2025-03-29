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
  extraHTML: string;
  containerId?: string; // Optional: Define a container for flexibility
}
