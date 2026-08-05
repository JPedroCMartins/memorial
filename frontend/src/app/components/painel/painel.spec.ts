import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Painel } from './painel';

describe('Painel', () => {
  let component: Painel;
  let fixture: ComponentFixture<Painel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Painel],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Painel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abre e fecha o modal de novo memorial', () => {
    component.toggleNovoMemorialModal();
    expect(component.isNovoMemorialModalOpen).toBe(true);
  });
});