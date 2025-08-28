import {
	AfterViewInit,
	Component,
	ElementRef,
	HostListener,
	SimpleChanges,
	effect,
	inject,
	viewChild
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../services/content-service.service';
import { ContentUpdateMessage, MessageTypes } from '../../types/window-message.type';

@Component({
	selector: 'app-iframe-preview',
	standalone: true,
	templateUrl: 'iframe-preview.html',
	styleUrl: 'iframe-preview.css',
})
export class IframePreview implements AfterViewInit {
	private readonly iframe = viewChild.required<ElementRef<HTMLIFrameElement>>('previewFrame');

	private sanitizer = inject(DomSanitizer);
	private contentService = inject(ContentService);

	iframeSrc: SafeResourceUrl;
	private iframeLoaded = false

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
			if (this.iframeLoaded && this.iframe()?.nativeElement) {
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

	ngAfterViewInit() {
		// Listen for iframe load event
		if (this.iframe()?.nativeElement) {
			this.iframe()?.nativeElement.addEventListener('load', () => {
				this.iframeLoaded = true;
				// Send initial content
				this.sendContentUpdate(this.contentService.contentSections(), this.contentService.globalStyle(), this.contentService.selectedSection());
			});
		}
	}

	private sendContentUpdate(sections: any[], globalStyle: any, selectedSection: string) {
		if (!this.iframe()?.nativeElement?.contentWindow) return;

		try {
			this.iframe()?.nativeElement.contentWindow!.postMessage(
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
		const contentWindow = this.iframe()?.nativeElement?.contentWindow;
		if (contentWindow) {
			console.log('ok this worked')
			try {
				contentWindow.focus();
				contentWindow.print();
				console.log('boom')
			} catch (error) {
				console.warn('Failed to print iframe content:', error);
				// Fallback: print the whole page
				window.print();
			}
		} else {
			console.log('this didnt work - contentWindow is:', contentWindow)
		}
	}
}
