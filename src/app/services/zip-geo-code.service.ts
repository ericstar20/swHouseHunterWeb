import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ZipGeoCodeService {
  private apiUrl = 'http://localhost:8080/geo-zipcode'; // Update with your backend URL

  constructor(private http: HttpClient) {}

  // Fetch all ZIP codes for a given state
  getZipCodesByState(state: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${state}`);
  }
}
