import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContentDisplay } from './content-display';

describe('ContentDisplay', () => {
  let component: ContentDisplay;
  let fixture: ComponentFixture<ContentDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
