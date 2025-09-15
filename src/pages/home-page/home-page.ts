import { Component, DestroyRef, effect, inject, signal, viewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { debounceTime } from 'rxjs';
import { ContentSection } from '../../components/content-section/content-section';
import { Header } from '../../components/header/header';
import { IframePreview } from '../../components/iframe-preview/iframe-preview';
import { ContentService } from '../../services/content-service.service';
import { FileHandlerService } from '../../services/file-handler-service.service';

@Component({
	selector: 'app-home-page',
	imports: [ContentSection, Header, IframePreview, ReactiveFormsModule],
	templateUrl: './home-page.html',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	styleUrl: './home-page.css',
})
export class HomePage {
	private readonly iframePreview = viewChild(IframePreview);
	private readonly formBuilder = inject(FormBuilder);
	private readonly contentService = inject(ContentService);
	private readonly domSanitizer = inject(DomSanitizer);
	private readonly destroyRef = inject(DestroyRef);
	private readonly fileHandlerService = inject(FileHandlerService);

	readonly globalStyle = this.contentService.globalStyle;

	readonly contentSections = this.contentService.contentSections;
	readonly previewMode = signal<'iframe' | 'pdf'>('iframe');
	readonly pdfUrl = signal<string | null>(null);
	readonly safePdfUrl = signal<SafeResourceUrl | null>(null);
	readonly showBrowserNote = signal<boolean>(false);
	readonly globalStylesVisible = signal(false);
	addSection() {
		this.contentService.createContentSection();
	}


	globalStyleForm!: FormGroup<{
		globalStyling: FormControl<string>;
	}>

	createGlobalStylingForm() {
		this.globalStyleForm = this.formBuilder.nonNullable.group({
			// defaultStyling will be the default page styling for the document
			globalStyling: new FormControl<string>(this.globalStyle(), { nonNullable: true })
		})
	}

	constructor() {
		// Simple Chromium detection: presence of (window as any).chrome and not Firefox
		const nav = navigator as any;
		const isChromium = !!(
			nav?.userAgent?.includes('Chrome') ||
			nav?.userAgentData?.brands?.some((b: any) =>
				/Chromium|Chrome/i.test(b.brand)
			)
		);
		const isFirefox = /Firefox/i.test(nav?.userAgent || '');
		this.showBrowserNote.set(!isChromium || isFirefox);
		this.createGlobalStylingForm();

		effect(() => {
			this.globalStyleForm.controls.globalStyling.setValue(this.globalStyle(), { emitEvent: false });
		});
	}

	ngOnInit() {
		this.globalStyleForm.valueChanges.pipe(
			debounceTime(500),
			takeUntilDestroyed(this.destroyRef)
		).subscribe((value) => {
			this.contentService.updateGlobalStyling(value.globalStyling!);
		})
	}


	printContent() {
		this.contentService.printSubject.next(null);
	}

	toggleGlobalStyles() {
		this.globalStylesVisible.set(!this.globalStylesVisible());
	}

	dismissBrowserNote() {
		this.showBrowserNote.set(false);
	}

	onGlobalStyleInput(event: any) {
		const target = event.target as any;
		const value = target.value || '';
		this.globalStyleForm.patchValue({ globalStyling: value });
	}


	livePreview() {
		this.previewMode.set("iframe");
	}

	saveToFile() {
		this.fileHandlerService.saveToFile({ globalStyles: this.contentService.globalStyle(), sections: this.contentService.contentSections() });
	}

	async loadFromFile() {
		try {
			const { globalStyles, sections } = await this.fileHandlerService.loadFromFile();
			this.contentService.setContentSections(sections);
			this.contentService.updateGlobalStyling(globalStyles);
		} catch (error) {
			if (error instanceof Error) {
				alert(error.message);
			} else {
				alert('An unknown error occurred.');
			}
		}
	}
}
