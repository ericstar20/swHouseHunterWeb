import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, switchMap, of } from 'rxjs';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root',
})
export class ZipGeoCodeService {
  private geoCodeApiUrl = `${environment.apiUrl}/geo-zipcode`;
  private incomeApiUrl = `${environment.apiUrl}/median-income`;
  private crimeApiUrl = `${environment.apiUrl}/crime`;

  /*
  private geoCodeApiUrl = 'http://localhost:8080/geo-zipcode';
  private incomeApiUrl = 'http://localhost:8080/median-income';
  private crimeApiUrl = 'http://localhost:8080/crime';
  */
  constructor(private http: HttpClient) {}

  //#region zipCode
  getZipCodesByState(state: string): Observable<any> {
    return this.http.get(`${this.geoCodeApiUrl}/${state}`);
  }
  //#endregion

  //#region medianIncome
  getAllMedianIncome(): Observable<any> {
    return this.http.get(`${this.incomeApiUrl}`);
  }

  getMedianIncomeByZipcode(zip: string): Observable<any> {
    const currentYear = 2023; //new Date().getFullYear();
    const maxYears = 3; //stop fetching after collecting 3 years of data
    return this.fetchMedianIncome(zip, currentYear, [], maxYears);
  }

  private fetchMedianIncome(
    zip: string,
    year: number,
    collectionData: any[],
    maxYears: number,
    minYear: number = new Date().getFullYear() - 6 //
  ): Observable<any[]> {
    if (collectionData.length >= maxYears || year < minYear) {
      console.warn(`🔚 Stopping fetch for ZIP ${zip}. Reached 6 years back.`);
      return of(collectionData);
    }

    return this.http.get(`${this.incomeApiUrl}/${year}/${zip}`).pipe(
      switchMap((data: any) => {
        if (data.status === 'not_found') {
          console.warn(`⚠️ Skipping ${year} for ZIP ${zip}: No data found.`);
          return this.fetchMedianIncome(
            zip,
            year - 1,
            collectionData,
            maxYears,
            minYear
          );
        }
        collectionData.push({ year, ...data });
        return this.fetchMedianIncome(zip, year - 1, collectionData, maxYears); // recursively calling
      }),
      catchError((error) => {
        if (error.status === 403) {
          console.warn(
            `🚫 403 Forbidden: Stopping further API calls for ZIP ${zip}`
          );
          return of(collectionData); // Stop fetching and return collected data
        }
        return this.fetchMedianIncome(zip, year - 1, collectionData, maxYears);
      })
    );
  }
  //#endregion

  //#region crimeData
  getAllCrimeData(): Observable<any> {
    return this.http.get(`${this.crimeApiUrl}`);
  }
  //#endregion
}
