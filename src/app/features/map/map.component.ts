import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ZipGeoCodeService } from '../../core/services/zip-geo-code.service';
import * as L from 'leaflet';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-map',
  standalone: false,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  markers: L.Marker[] = [L.marker([32.7767, -96.797])];
  private zipBoundaryLayer = L.layerGroup();
  private incomeChart!: Chart;
  private popupDiv!: HTMLDivElement;

  constructor(private zipGeoCodeService: ZipGeoCodeService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
    this.loadZipBoundariesForState('TX'); // Load ZIP codes for Texas
  }

  private initMap() {
    this.map = L.map('map', {
      zoomSnap: 1, // Ensures smooth zoom adjustment
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map
    );

    // Define DFW Metroplex bounding box with a slightly zoomed-in view
    const dfwBounds: L.LatLngBoundsExpression = [
      [32.6, -97.3], // Adjusted Southwest corner
      [33.2, -96.7], // Adjusted Northeast corner
    ];

    this.map.fitBounds(dfwBounds); // Fit map to show a zoomed-in DFW area
    this.zipBoundaryLayer.addTo(this.map);

    // create a floating div for the popup chart
    this.popupDiv = document.createElement('div');
    this.popupDiv.id = 'income-chart-popup';
    this.popupDiv.style.position = 'absolute';
    this.popupDiv.style.background = 'white';
    this.popupDiv.style.padding = '10px';
    this.popupDiv.style.borderRadius = '5px';
    this.popupDiv.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
    this.popupDiv.style.display = 'none';
    document.body.appendChild(this.popupDiv);
  }

  // Fetch and display ZIP boundaries for a state
  private loadZipBoundariesForState(state: string) {
    this.zipGeoCodeService.getZipCodesByState(state).subscribe(
      (response) => {
        // ✅ Log the raw API response
        console.log('🔥 API Response:', response);

        if (!response || !response.features || response.features.length === 0) {
          console.warn('❌ No ZIP boundaries found for state:', state);
          return;
        }

        // ✅ Log the number of ZIP codes received
        console.log(
          `✅ Received ${response.features.length} ZIP boundaries for state:`,
          state
        );
        this.zipBoundaryLayer.clearLayers();

        // Add new ZIP boundaries
        response.features.forEach((zipData: any) => {
          const zipLayer = L.geoJSON(zipData.geometry, {
            style: { color: '#6f42c1', weight: 1.5 },
          });

          zipLayer
            .bindPopup(`ZIP: ${zipData.properties.zip}`)
            .on('click', (e: any) => this.onZipClick(e, zipData.properties));

          zipLayer.addTo(this.map);
        });
      },
      (error) => console.error('❌ Error fetching ZIP boundaries:', error)
    );
  }

  private onZipClick(event: any, properties: any) {
    const zip = properties.zip;
    console.log(`📍 ZIP Code Clicked: ${zip}`);

    this.zipGeoCodeService.getMedianIncomeByZipcode(zip).subscribe(
      (incomeData) => {
        console.log(`📊 Median Income Data for ZIP ${zip}:`, incomeData);
        this.showIncomeChart(event, zip, incomeData);
      },
      (error) =>
        console.error(`❌ Error fetching income data for ZIP ${zip}:`, error)
    );
  }

  private showIncomeChart(event: any, zip: string, incomeData: any[]) {
    if (!incomeData || incomeData.length === 0) {
      console.warn(`❌ No median income data available for ZIP: ${zip}`);
      return;
    }
    incomeData.sort((a, b) => a.year - b.year);

    const years = incomeData.map((entry) => entry.year);
    const incomeValues = incomeData.map(
      (entry) => entry.data.totalHouseholdMedianIncome ?? 0
    );

    // **Clear previous content**
    this.popupDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button id="close-popup" style="
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
    canvas.id = 'income-chart';
    canvas.style.width = '300px';
    canvas.style.height = '200px';
    this.popupDiv.appendChild(canvas);

    // **Fix Popup Size**
    this.popupDiv.style.width = '320px';
    this.popupDiv.style.height = '250px';

    // **Destroy Previous Chart**
    if (this.incomeChart) {
      this.incomeChart.destroy();
    }

    // **Create Chart**
    this.incomeChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Median Income',
            data: incomeValues,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              font: {
                size: 14, // ✅ Make the legend (ZIP Code Label) more readable
                weight: 'bold',
              },
              color: '#333', // ✅ Improve contrast
            },
          },
          title: {
            display: true,
            text: `ZIP: ${zip}`, // ✅ Show ZIP as chart title
            font: {
              size: 16,
              weight: 'bold',
            },
            color: '#000',
            padding: {
              top: 10,
              bottom: 10,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: 12, // ✅ Improve X-axis label readability
              },
              color: '#555',
            },
          },
          y: {
            ticks: {
              font: {
                size: 12, // ✅ Improve Y-axis readability
              },
              color: '#555',
              callback: (value) => `$${value.toLocaleString()}`, // ✅ Format as currency
            },
          },
        },
      },
    });

    // **Position the Popup**
    const { x, y } = this.map.latLngToContainerPoint(event.latlng);
    this.popupDiv.style.left = `${x + 10}px`;
    this.popupDiv.style.top = `${y - 50}px`;
    this.popupDiv.style.display = 'block';
    this.popupDiv.style.zIndex = '1000';

    console.log(
      '📌 Popup should be visible at:',
      this.popupDiv.style.left,
      this.popupDiv.style.top
    );

    // **Add Event Listener for Close Button**
    document.getElementById('close-popup')?.addEventListener('click', () => {
      this.hideIncomeChart();
    });
  }

  private hideIncomeChart() {
    this.popupDiv.style.display = 'none';
  }
}
