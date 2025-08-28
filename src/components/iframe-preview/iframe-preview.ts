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
import { ContentUpdateMessage, MessageTypes, SectionMovedMessage } from '../../types/window-message.type';

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
			const globalStyle = this.contentService.globalStyle();
			const selectedSection = this.contentService.selectedSection();
			// Only send updates if iframe is loaded
			if (this.iframeLoaded && this.iframe?.nativeElement) {
				this.sendContentUpdate(sections, globalStyle, selectedSection);
			}
		});
	}

	@HostListener('window:message', ['$event'])
	onMessage(event: MessageEvent) {
		if (event.data?.type === MessageTypes.IFRAME_READY) {
			this.iframeLoaded = true;
			// Send initial content
			this.sendContentUpdate(this.contentService.contentSections(), this.contentService.globalStyle(), this.contentService.selectedSection());
		} else if (event.data?.type === MessageTypes.SECTION_MOVED) {
			const { previousIndex, currentIndex } = event.data.sectionMoved;
			console.log('Section moved');
			console.log('previousIndex, currentIndex: ', previousIndex, currentIndex);
			this.contentService.updateSectionIndex(previousIndex, currentIndex)
		} else if (event.data?.type === MessageTypes.SECTION_SELECTED) {
			this.contentService.selectedSection.set(event.data.sectionId)
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
				this.sendContentUpdate(this.contentService.contentSections(), this.contentService.globalStyle(), this.contentService.selectedSection());
			});
		}
	}

	private sendContentUpdate(sections: any[], globalStyle: any, selectedSection: string) {
		if (!this.iframe?.nativeElement?.contentWindow) return;

		try {
			this.iframe.nativeElement.contentWindow.postMessage(
				{
					type: MessageTypes.CONTENT_UPDATE,
					content: {
						sections: sections,
						globalStyle: globalStyle,
						selectedSection: selectedSection
					}
				} satisfies ContentUpdateMessage,
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
