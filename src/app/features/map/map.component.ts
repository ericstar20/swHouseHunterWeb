import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ZipGeoCodeService } from '../../core/services/zip-geo-code.service';
import { showChartPopup } from '../../shared/utils/chart.utils';
import { MedianIncomeData } from '../../shared/models/median-income.model';
import { ChartDataConfig } from '../../shared/models/chart-data.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: false,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  private zipBoundaryLayer = L.layerGroup();
  private popupDiv!: HTMLDivElement;
  private zipLayers: { layer: L.Layer; rank: string }[] = [];
  private incomeDataCache: { [zip: string]: number } = {};
  private crimeDataCache: { [zip: string]: any } = {};

  constructor(private zipGeoCodeService: ZipGeoCodeService) {}

  ngOnInit() {
    this.loadBatchMedianIncome();
    this.loadBatchCrimeData();
    this.loadZipBoundariesForState('TX');
  }

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map('map', { zoomSnap: 1 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(
      this.map
    );
    this.map.fitBounds([
      [32.6, -97.3],
      [33.2, -96.7],
    ]);
    this.zipBoundaryLayer.addTo(this.map);

    this.popupDiv = document.createElement('div');
    Object.assign(this.popupDiv.style, {
      position: 'absolute',
      background: 'white',
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
      display: 'none',
    });
    document.body.appendChild(this.popupDiv);
  }

  private loadBatchMedianIncome() {
    this.zipGeoCodeService.getAllMedianIncome().subscribe(
      (resp) =>
        resp.forEach(
          (data: any) =>
            (this.incomeDataCache[data.zipCode] =
              data.totalHouseholdMedianIncome)
        ),
      (error) => console.error('❌ Error loading batch median income:', error)
    );
  }

  private loadBatchCrimeData() {
    this.zipGeoCodeService
      .getAllCrimeData()
      .subscribe((resp) =>
        resp.forEach((data: any) => (this.crimeDataCache[data.zipCode] = data))
      );
  }

  private loadZipBoundariesForState(state: string) {
    this.zipGeoCodeService.getZipCodesByState(state).subscribe(
      (response) => {
        if (!response?.features?.length) return;

        this.zipBoundaryLayer.clearLayers();
        response.features.forEach((zipData: any) => {
          const zip = zipData.properties.zip;
          const latestIncome = this.incomeDataCache[zip] ?? null;
          const zipRanking = this.getZipRanking(latestIncome, zip);
          const fillColor = this.getZipRankingColor(zipRanking);

          const zipLayer = L.geoJSON(zipData.geometry, {
            style: {
              color: '#6f42c1',
              weight: 1.5,
              fillColor,
              fillOpacity: 0.6,
            },
          })
            .bindPopup(`ZIP: ${zip} - Rank: ${zipRanking}`)
            .on('click', (e: any) => this.onZipClick(e, zipData.properties));

          zipLayer.addTo(this.zipBoundaryLayer);
          this.zipLayers.push({ layer: zipLayer, rank: zipRanking });
        });
      },
      (error) => console.error('❌ Error fetching ZIP boundaries:', error)
    );
  }

  private onZipClick(event: any, properties: any) {
    const zip = properties.zip;

    this.zipGeoCodeService.getMedianIncomeByZipcode(zip).subscribe(
      (incomeData: MedianIncomeData[]) => {
        if (!incomeData?.length) return;

        incomeData.sort((a, b) => a.year - b.year);
        const years = incomeData.map((entry) => entry.year.toString());
        const incomeValues = incomeData.map(
          (entry) => entry.data.totalHouseholdMedianIncome ?? 0
        );
        const latestIncome =
          incomeData[incomeData.length - 1]?.data?.totalHouseholdMedianIncome ??
          null;
        const zipRanking = this.getZipRanking(latestIncome, zip);
        const crimeData = this.crimeDataCache[zip] || null;

        const crimeInfoHTML = crimeData
          ? `
          <div style="
            margin-top: 12px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 6px;
            border-left: 4px solid ${this.getCrimeGradeColor(
              crimeData.overallCrimeGrade
            )};
            font-family: Arial, sans-serif;
            font-size: 14px;
          ">
            <h5 style="margin: 0 0 8px; font-size: 16px; font-weight: bold; color: #333;">
              Crime Data
            </h5>
            <p style="margin: 5px 0;"><strong>Overall Crime Grade:</strong> 
              <span style="color: ${this.getCrimeGradeColor(
                crimeData.overallCrimeGrade
              )}; font-weight: bold;">
                ${crimeData.overallCrimeGrade}
              </span>
            </p>
            <p style="margin: 5px 0;"><strong>Violent Crime:</strong> ${
              crimeData.violentCrimeGrade
            }</p>
            <p style="margin: 5px 0;"><strong>Property Crime:</strong> ${
              crimeData.propertyCrimeGrade
            }</p>
            <p style="margin: 5px 0;"><strong>Other Crime:</strong> ${
              crimeData.otherCrimeGrade
            }</p>
            <p style="margin: 5px 0;"><strong>Risk:</strong> ${
              crimeData.risk
            } (${crimeData.riskDetail})</p>
          </div>
        `
          : `<p style="margin-top: 10px; color: #888;">No crime data available.</p>`;

        const chartConfig: ChartDataConfig = {
          title: `Median Income - ZIP ${zip} (${zipRanking})`,
          labels: years,
          datasets: [
            {
              label: 'Median Income',
              data: incomeValues.map((val) => (val === null ? 0 : val)),
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.2)',
            },
          ],
          position: this.map.latLngToContainerPoint(event.latlng),
          extraHTML: crimeInfoHTML,
        };

        showChartPopup(chartConfig);
      },
      (error) =>
        console.error(`❌ Error fetching income data for ZIP ${zip}:`, error)
    );
  }

  private getZipRanking(medianIncome: number | null, zip: string): string {
    if (medianIncome === null) return 'N/A';

    const crimeData = this.crimeDataCache[zip] || null;
    let crimeScore = 0;

    if (crimeData) {
      const crimeGradeToScore: Record<string, number> = {
        'A+': 10,
        A: 9,
        'A-': 8,
        'B+': 7,
        B: 6,
        'B-': 5,
        'C+': 4,
        C: 3,
        'C-': 2,
        'D+': 1,
        D: 0,
        'D-': -1,
        F: -2,
      };

      const grade =
        crimeData.overallCrimeGrade as keyof typeof crimeGradeToScore;
      crimeScore = crimeGradeToScore[grade] ?? 0;
    }

    const weightedScore = medianIncome / 10000 + crimeScore * 5;

    return weightedScore > 25
      ? 'S'
      : weightedScore > 15
      ? 'A'
      : weightedScore > 5
      ? 'B'
      : weightedScore > 0
      ? 'C'
      : 'D';
  }

  private getZipRankingColor(ranking: string): string {
    return ranking === 'S'
      ? '#00441b'
      : ranking === 'A'
      ? '#238b45'
      : ranking === 'B'
      ? '#66c2a4'
      : ranking === 'C'
      ? '#feb24c'
      : ranking === 'D'
      ? '#e31a1c'
      : '#808080';
  }

  private getCrimeGradeColor(grade: string): string {
    const gradeColors: Record<string, string> = {
      'A+': '#2ca02c',
      A: '#32a852',
      'A-': '#47b25e',
      'B+': '#86c232',
      B: '#b6d432',
      'B-': '#e1e632',
      'C+': '#e8a232',
      C: '#eb7d32',
      'C-': '#eb4d32',
      'D+': '#eb3232',
      D: '#d62828',
      'D-': '#b22222',
      F: '#8b0000',
    };
    return gradeColors[grade] || '#555'; // Default to gray if undefined
  }

  filterZipByRanking(event: any) {
    const selectedRank = event.target.value;
    this.zipBoundaryLayer.clearLayers();
    this.zipLayers.forEach(({ layer, rank }) => {
      if (!selectedRank || rank === selectedRank)
        this.zipBoundaryLayer.addLayer(layer);
    });
  }
}
