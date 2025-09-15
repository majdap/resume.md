import {
	Component,
	computed,
	DestroyRef,
	inject,
	input,
	OnInit,
	AfterViewInit,
	ElementRef,
	ViewChild,
	signal,
	CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	FormBuilder,
	FormControl,
	FormGroup,
	ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ContentService } from '../../services/content-service.service';
import { ContentSectionProperty } from '../../types/content-section.type';

@Component({
	selector: 'app-content-section',
	imports: [ReactiveFormsModule],
	templateUrl: './content-section.html',
	styleUrl: './content-section.css',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	host: {
		'[class.selected]': 'isSelected()',
	},
})
export class ContentSection implements OnInit, AfterViewInit {
	private readonly contentService = inject(ContentService);
	private readonly formBuilder = inject(FormBuilder);
	private readonly destroyRef = inject(DestroyRef);

	readonly id = input.required<string>();
	readonly content = input<string>();
	readonly styling = input<string>();

	readonly showContent = signal(true);
	readonly isSelected = computed(
		() => this.id() === this.contentService.selectedSection()
	);

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
		if (window.confirm('Are you sure you want to delete section?')) {
			this.contentService.removeContentSection(this.id());
		}
	}

	sectionSelected() {
		this.contentService.selectedSection.set(this.id());
	}

	onContentInput(event: Event) {
		const target = event.target as any;
		const value = target.value || '';
		this.contentForm.patchValue({ content: value });
	}

	onStylingInput(event: Event) {
		const target = event.target as any;
		const value = target.value || '';
		this.styleForm.patchValue({ styling: value });
	}

	ngAfterViewInit() {
		// Templates are now registered globally in main.ts
	}
}
