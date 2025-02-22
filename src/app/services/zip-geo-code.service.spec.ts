import { TestBed } from '@angular/core/testing';

import { ZipGeoCodeService } from './zip-geo-code.service';

describe('ZipGeoCodeService', () => {
  let service: ZipGeoCodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZipGeoCodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
