import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ZipGeoCodeService } from '../../core/services/zip-geo-code.service';
import * as L from 'leaflet';
import { Chart } from 'chart.js/auto';
import { showChartPopup } from '../../shared/utils/chart.utils';
import { MedianIncomeData } from '../../shared/models/median-income.model';
import { ChartDataConfig } from '../../shared/models/chart-data.model';
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
            style: {
              color: '#6f42c1',
              weight: 1.5,
              fillOpacity: 0,
            },
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
      (incomeData: MedianIncomeData[]) => {
        console.log(`📊 Median Income Data for ZIP ${zip}:`, incomeData);

        if (!incomeData || incomeData.length === 0) {
          console.warn(`❌ No median income data available for ZIP: ${zip}`);
          return;
        }

        // **Sort data chronologically**
        incomeData.sort(
          (a: MedianIncomeData, b: MedianIncomeData) => a.year - b.year
        );

        const years = incomeData.map((entry) => entry.year.toString());
        const incomeValues = incomeData.map(
          (entry) => entry.data.totalHouseholdMedianIncome ?? 0
        );
        const latestIncome =
          incomeData[incomeData.length - 1]?.data?.totalHouseholdMedianIncome ??
          null;
        const zipRanking = this.getZipRanking(latestIncome);

        // ✅ Use shared function for chart display
        const chartConfig: ChartDataConfig = {
          title: `Median Income - ZIP ${zip} (${zipRanking})`,
          labels: years,
          datasets: [
            {
              label: 'Median Income',
              data: incomeValues.map((val) => (val === null ? 0 : val)), // Prevents null from breaking the chart
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.2)',
            },
          ],
          position: this.map.latLngToContainerPoint(event.latlng),
        };

        showChartPopup(chartConfig);
      },
      (error) =>
        console.error(`❌ Error fetching income data for ZIP ${zip}:`, error)
    );
  }

  private getZipRanking(medianIncome: number | null): string {
    if (medianIncome === null || medianIncome === undefined) return 'Unknown';
    if (medianIncome >= 120000) return 'S';
    if (medianIncome >= 90000) return 'A';
    if (medianIncome >= 60000) return 'B';
    if (medianIncome >= 30000) return 'C';
    return 'D';
  }
}
