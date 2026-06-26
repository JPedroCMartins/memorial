import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Memorial } from './memorial';

describe('Memorial', () => {
  let component: Memorial;
  let fixture: ComponentFixture<Memorial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Memorial],
    }).compileComponents();

    fixture = TestBed.createComponent(Memorial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
