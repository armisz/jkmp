import {TestBed} from '@angular/core/testing';

import {KodiService} from './kodi.service';

describe('KodiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: KodiService = TestBed.get(KodiService);
    expect(service).toBeTruthy();
  });
});
