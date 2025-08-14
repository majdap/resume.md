import {
	Component,
	DestroyRef,
	inject,
	input,
	OnInit,
	signal,
} from '@angular/core';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
} from '@angular/forms';
import { ContentService } from '../../services/content-service.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, merge, tap } from 'rxjs';
import { ContentSectionProperty } from '../../types/content-section.type';

@Component({
	selector: 'app-content-section',
	imports: [ReactiveFormsModule],
	templateUrl: './content-section.html',
	styleUrl: './content-section.css',
})
export class ContentSection implements OnInit {
	private readonly contentService = inject(ContentService);
	private readonly formBuilder = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);

	readonly id = input.required<string>();
	readonly content = input<string>();
	readonly styling = input<string>();

	readonly showContent = signal(true);

	contentForm!: FormGroup<{
		content: FormControl<string>;
	}>;

	styleForm!: FormGroup<{
		styling: FormControl<string>;
	}>;

	createContentForm() {
		this.contentForm = this.formBuilder.nonNullable.group({
			content: new FormControl<string>(this.content() ?? '', {
				nonNullable: true,
			}),
		});
	}

	createStyleForm() {
		this.styleForm = this.formBuilder.nonNullable.group({
			styling: new FormControl<string>(this.styling() ?? '', {
				nonNullable: true,
			}),
		});
	}

	ngOnInit() {
		this.createContentForm();
		this.createStyleForm();

		// Separate observable for content changes
		this.contentForm.valueChanges
			.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
			.subscribe((value) => {
				this.contentService.updateContentSection(
					this.id(),
					ContentSectionProperty.CONTENT,
					value.content ?? ''
				);
			});

		// Separate observable for styling changes
		this.styleForm.valueChanges
			.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
			.subscribe((value) => {
				this.contentService.updateContentSection(
					this.id(),
					ContentSectionProperty.STYLING,
					value.styling ?? ''
				);
			});
	}

	removeSection() {
		this.contentService.removeContentSection(this.id());
	}
}
