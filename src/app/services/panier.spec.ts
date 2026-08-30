import { TestBed } from '@angular/core/testing';

import { Panier } from './panier';

describe('Panier', () => {
  let service: Panier;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Panier);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
