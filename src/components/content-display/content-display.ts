import {
	Component,
	HostBinding,
	HostListener,
	inject,
	signal,
	OnInit,
} from '@angular/core';
import { DisplayContentSection } from './display-content-section/display-content-section';
import { ContentService } from '../../services/content-service.service';

@Component({
	selector: 'app-content-display',
	imports: [DisplayContentSection],
	templateUrl: './content-display.html',
	styleUrl: './content-display.css',
})
export class ContentDisplay implements OnInit {
	private readonly contentService = inject(ContentService);

	readonly sections = this.contentService.contentSections;

	selectedSectionId = '';

	ngOnInit() {
		// Signal that iframe is ready to receive content updates
		window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
	}

	@HostListener('window:message', ['$event'])
	onMessage(event: MessageEvent) {
		if (event.data?.type === 'CONTENT_UPDATE') {
			// Update the content service with new sections
			this.contentService.contentSections.set(event.data.sections);
		}
	}

	// Attribute toggled to force layout reflow before printing (Firefox line wrap consistency)
	@HostBinding('attr.data-print-reflow') reflowToggle = false;

	@HostListener('window:beforeprint') async handleBeforePrint() {
		const anyDoc: any = document;
		if (anyDoc.fonts?.ready) {
			try {
				await anyDoc.fonts.ready;
			} catch {
				/* ignore */
			}
		}
		// Force style + layout flush
		this.reflowToggle = !this.reflowToggle;
		void document.body.offsetHeight; // access to ensure reflow
	}

	@HostListener('window:afterprint') handleAfterPrint() {
		// Reset (not strictly necessary but keeps parity)
		this.reflowToggle = !this.reflowToggle;
	}
}
