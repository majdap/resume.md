import { Component, computed, ElementRef, inject, signal, ViewChild, Renderer2, effect, DestroyRef, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../services/content-service.service';
import { ContentSection } from '../../components/content-section/content-section';
import { Header } from '../../components/header/header';
import { IframePreview } from '../../components/iframe-preview/iframe-preview';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { defaultStyling } from './default-styling';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
	selector: 'app-home-page',
	imports: [ContentSection, Header, IframePreview, ReactiveFormsModule],
	templateUrl: './home-page.html',
	styleUrl: './home-page.css',
})
export class HomePage {
	private readonly iframePreview = viewChild(IframePreview);
	private readonly formBuilder = inject(FormBuilder);
	private readonly contentService = inject(ContentService);
	private readonly domSanitizer = inject(DomSanitizer);
	private readonly destroyRef = inject(DestroyRef);

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
			globalStyling: new FormControl<string>(defaultStyling ?? '', { nonNullable: true })
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
	}

	ngOnInit() {
		this.contentService.updateGlobalStyling(defaultStyling)
		this.globalStyleForm.valueChanges.pipe(
			debounceTime(500),
			takeUntilDestroyed(this.destroyRef)
		).subscribe((value) => {
			console.log("GLOBAL STYLES UPDATE IN HOME PAGE, ", value);
			this.contentService.updateGlobalStyling(value.globalStyling!);
		})
	}

	exportPdf() {
		// const sections = this.contentSections();
		// const globalStyles = this.contentService.globalStyle();
		// try {
		// 	const res = await fetch('/api/export/pdf', {
		// 		method: 'POST',
		// 		headers: { 'Content-Type': 'application/json' },
		// 		body: JSON.stringify({ globalStyles, sections }),
		// 	});
		// 	if (!res.ok) throw new Error('Failed to export PDF');
		// 	const blob = await res.blob();
		// 	const url = URL.createObjectURL(blob);
		// 	// Show inline if requested
		// 	this.pdfUrl.set(url);
		// 	this.safePdfUrl.set(
		// 		this.domSanitizer.bypassSecurityTrustResourceUrl(url)
		// 	);
		// 	this.previewMode.set('pdf');
		// } catch (e) {
		// 	console.error(e);
		// 	alert('PDF export failed.');
		// }
		const iframeComponent = this.iframePreview();
		if (iframeComponent) {
			console.log('yippee')
			iframeComponent.printContent();
		}
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


	livePreview() {
		this.previewMode.set("iframe");
	}
}
