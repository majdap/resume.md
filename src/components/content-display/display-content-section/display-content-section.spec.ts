import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayContentSection } from './display-content-section';

describe('DisplayContentSection', () => {
  let component: DisplayContentSection;
  let fixture: ComponentFixture<DisplayContentSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayContentSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisplayContentSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
