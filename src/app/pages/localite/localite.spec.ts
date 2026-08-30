import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Localite } from './localite';

describe('Localite', () => {
  let component: Localite;
  let fixture: ComponentFixture<Localite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Localite],
    }).compileComponents();

    fixture = TestBed.createComponent(Localite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
