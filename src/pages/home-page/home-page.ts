import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../services/content-service.service';
import { ContentSection } from '../../components/content-section/content-section';
import { Header } from '../../components/header/header';
import { ContentDisplay } from '../../components/content-display/content-display';
import { IframePreview } from '../../components/iframe-preview/iframe-preview';

@Component({
	selector: 'app-home-page',
	imports: [ContentSection, Header, ContentDisplay, IframePreview],
	templateUrl: './home-page.html',
	styleUrl: './home-page.css',
})
export class HomePage {
	@ViewChild(IframePreview) iframePreview?: IframePreview;

	private contentService = inject(ContentService);
	private sanitizer = inject(DomSanitizer);
	readonly contentSections = this.contentService.contentSections;

	// Live preview mode: 'dom', 'iframe', or 'pdf'
	readonly previewMode = signal<'dom' | 'iframe' | 'pdf'>('iframe');
	readonly pdfUrl = signal<string | null>(null);
	readonly safePdfUrl = signal<SafeResourceUrl | null>(null);
	readonly showBrowserNote = signal<boolean>(false);

	addSection() {
		this.contentService.createContentSection();
	}

	constructor() {
		// Simple Chromium detection: presence of (window as any).chrome and not Firefox
		// Only check if we're in browser environment
		const isBrowser = typeof navigator !== 'undefined';
		const nav = isBrowser ? navigator as any : null;
		const isChromium = isBrowser && !!(
			nav?.userAgent?.includes('Chrome') ||
			nav?.userAgentData?.brands?.some((b: any) =>
				/Chromium|Chrome/i.test(b.brand)
			)
		);
		const isFirefox = isBrowser && /Firefox/i.test(nav?.userAgent || '');
		this.showBrowserNote.set(isBrowser && (!isChromium || isFirefox));
	}

	async exportPdf() {
		const sections = this.contentSections();
		try {
			const res = await fetch('/api/export/pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sections }),
			});
			if (!res.ok) throw new Error('Failed to export PDF');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			// Show inline if requested
			this.pdfUrl.set(url);
			this.safePdfUrl.set(
				this.sanitizer.bypassSecurityTrustResourceUrl(url)
			);
			this.previewMode.set('pdf');
		} catch (e) {
			console.error(e);
			alert('PDF export failed.');
		}
	}

	showDomPreview() {
		this.previewMode.set('dom');
		const url = this.pdfUrl();
		if (url) setTimeout(() => URL.revokeObjectURL(url), 0);
		this.pdfUrl.set(null);
		this.safePdfUrl.set(null);
	}

	showIframePreview() {
		this.previewMode.set('iframe');
		const url = this.pdfUrl();
		if (url) setTimeout(() => URL.revokeObjectURL(url), 0);
		this.pdfUrl.set(null);
		this.safePdfUrl.set(null);
	}

	dismissBrowserNote() {
		this.showBrowserNote.set(false);
	}

	printPreview() {
		const mode = this.previewMode();
		if (mode === 'iframe' && this.iframePreview) {
			// Print the iframe content
			this.iframePreview.printContent();
		} else if (mode === 'dom') {
			// Print the current page (which includes the DOM preview)
			window.print();
		} else if (mode === 'pdf') {
			// For PDF mode, the user can print from the PDF viewer
			window.print();
		}
	}
}
