import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentSection } from './content-section';

describe('ContentSection', () => {
  let component: ContentSection;
  let fixture: ComponentFixture<ContentSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
