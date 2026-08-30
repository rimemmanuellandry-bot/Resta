import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandeStatus } from './commande-status';

describe('CommandeStatus', () => {
  let component: CommandeStatus;
  let fixture: ComponentFixture<CommandeStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandeStatus],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandeStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
