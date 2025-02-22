import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ZipGeoCodeService } from '../services/zip-geo-code.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: false,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  private map!: L.Map;
  markers: L.Marker[] = [L.marker([32.7767, -96.797])];

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

        // Add new ZIP boundaries
        response.features.forEach((zipData: any) => {
          const zipLayer = L.geoJSON(zipData.geometry, {
            style: { color: '#6f42c1', weight: 1.5 },
          }).bindPopup(`ZIP: ${zipData.properties.zip}`);
          zipLayer.addTo(this.map);
        });
      },
      (error) => console.error('❌ Error fetching ZIP boundaries:', error)
    );
  }
}
