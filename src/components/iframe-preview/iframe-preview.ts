import {
	Component,
	ElementRef,
	ViewChild,
	OnChanges,
	SimpleChanges,
	OnInit,
	effect,
	AfterViewInit,
	inject,
	HostListener,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../services/content-service.service';

@Component({
	selector: 'app-iframe-preview',
	standalone: true,
	template: `
		<div class="iframe-container">
			<iframe
				#previewFrame
				[src]="iframeSrc"
				frameborder="0"
				sandbox="allow-scripts allow-same-origin"
				title="CV Preview"
			>
			</iframe>
		</div>
	`,
	styles: [
		`
			:host {
				display: block;
				width: 100%;
				height: 100%;
			}

			.iframe-container {
				width: 100%;
				height: 100%;
				border-radius: var(--radius-m, 4px);
			}

			iframe {
				display: block;
				width: 100%;
				height: 100%;
				border: none;
			}

			/* Print styles - hide iframe chrome and let content flow naturally */
			@media print {
				:host {
					width: 100% !important;
					height: auto !important;
					min-height: 297mm !important; /* A4 height */
					overflow: visible !important;
				}

				.iframe-container {
					border: none !important;
					border-radius: 0 !important;
					overflow: visible !important;
					height: auto !important;
					min-height: 296mm !important;
				}

				iframe {
					width: 100% !important;
					height: 297mm !important; /* Force A4 height for print */
					min-height: 297mm !important;
					border: none !important;
					overflow: visible !important;
				}
			}
		`,
	],
})
export class IframePreview implements OnInit, AfterViewInit, OnChanges {
	@ViewChild('previewFrame') iframe!: ElementRef<HTMLIFrameElement>;

	private sanitizer = inject(DomSanitizer);
	private contentService = inject(ContentService);

	iframeSrc: SafeResourceUrl;
	private iframeLoaded = false;

	constructor() {
		// Point to our preview route
		this.iframeSrc =
			this.sanitizer.bypassSecurityTrustResourceUrl('/preview');

		// Watch for content changes and send updates via postMessage
		effect(() => {
			const sections = this.contentService.contentSections();
			// Only send updates if iframe is loaded
			if (this.iframeLoaded && this.iframe?.nativeElement) {
				this.sendContentUpdate(sections);
			}
		});
	}

	@HostListener('window:message', ['$event'])
	onMessage(event: MessageEvent) {
		if (event.data?.type === 'IFRAME_READY') {
			this.iframeLoaded = true;
			// Send initial content
			this.sendContentUpdate(this.contentService.contentSections());
		}
	}

	ngOnInit() {
		// HostListener handles message events
	}

	// ngOnDestroy() {
	// 	if (this.messageListener) {
	// 		window.removeEventListener('message', this.messageListener);
	// 	}
	// }

	ngAfterViewInit() {
		// Listen for iframe load event
		if (this.iframe?.nativeElement) {
			this.iframe.nativeElement.addEventListener('load', () => {
				this.iframeLoaded = true;
				// Send initial content
				this.sendContentUpdate(this.contentService.contentSections());
			});
		}
	}

	private sendContentUpdate(sections: any[]) {
		if (!this.iframe?.nativeElement?.contentWindow) return;

		try {
			this.iframe.nativeElement.contentWindow.postMessage(
				{
					type: 'CONTENT_UPDATE',
					sections: sections,
				},
				'*' // In production, replace with specific origin
			);

			// Adjust iframe height after content update
		} catch (error) {
			console.warn('Failed to send content update to iframe:', error);
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		// Handle any input changes if needed
	}

	// Method to trigger print of iframe content
	printContent() {
		if (this.iframe?.nativeElement?.contentWindow) {
			try {
				this.iframe.nativeElement.contentWindow.print();
			} catch (error) {
				console.warn('Failed to print iframe content:', error);
				// Fallback: print the whole page
				window.print();
			}
		}
	}
}
