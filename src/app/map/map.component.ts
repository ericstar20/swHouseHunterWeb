import { Component, OnInit, AfterViewInit } from '@angular/core';
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

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map('map', {
      zoomSnap: 0.5, // Ensures smooth zoom adjustment
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
}
