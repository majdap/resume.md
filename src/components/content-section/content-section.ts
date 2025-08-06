import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ContentService } from '../../services/content-service.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-content-section',
  imports: [ReactiveFormsModule],
  templateUrl: './content-section.html',
  styleUrl: './content-section.css'
})
export class ContentSection implements OnInit {
  private readonly contentService = inject(ContentService)
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly content = input<string>();
  readonly id = input.required<string>();

  contentForm!: FormGroup<{
    content: FormControl<string>;
  }>;

  createContentForm() {
    this.contentForm = this.formBuilder.nonNullable.group({
      content: new FormControl<string>(this.content() ?? '', { nonNullable: true }),
    })
  }

  ngOnInit() {
    this.createContentForm();

    this.contentForm.valueChanges.pipe(
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.contentService.updateContentSection(this.id(), value.content ?? '');
    });
  }
}
