import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StyleEditorDialog } from './style-editor-dialog';

describe('StyleEditorDialog', () => {
  let component: StyleEditorDialog;
  let fixture: ComponentFixture<StyleEditorDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StyleEditorDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StyleEditorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
