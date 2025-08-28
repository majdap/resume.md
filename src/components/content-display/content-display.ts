import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	inject,
	OnInit,
	Renderer2,
	SecurityContext,
	signal
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ContentSection } from '../../types/content-section.type';
import { MessageTypes, SectionMovedMessage } from '../../types/window-message.type';
import { DisplayContentSection } from './display-content-section/display-content-section';
@Component({
	selector: 'app-content-display',
	imports: [DisplayContentSection, CdkDropList, CdkDrag],
	templateUrl: './content-display.html',
	styleUrl: './content-display.css',
	host: { "class": "document" }
})
export class ContentDisplay implements OnInit {
	private readonly renderer2 = inject(Renderer2);
	private readonly elementRef = inject(ElementRef);
	private readonly domSanitizer = inject(DomSanitizer);
	readonly globalStyling = signal('');
	readonly sections = signal<ContentSection[]>([]);
	private styleElement = signal<HTMLStyleElement | null>(null);
	readonly selectedSectionId = signal('');

	ngOnInit() {
		// Signal that iframe is ready to receive content updates
		window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
	}

	@HostListener('window:message', ['$event'])
	onMessage(event: MessageEvent) {
		if (event.data?.type === 'CONTENT_UPDATE') {
			const { sections, globalStyle, selectedSection } = event.data.content;
			this.sections.set(sections);
			this.globalStyling.set(globalStyle);
			this.selectedSectionId.set(selectedSection);
			if (!this.styleElement()) {
				// Create the style element once
				this.styleElement.set(this.renderer2.createElement('style'));
				this.renderer2.appendChild(
					this.elementRef.nativeElement,
					this.styleElement()
				);
			}

			// Update the style content - we know styleElement is not null here
			if (this.styleElement()) {
				this.styleElement()!.textContent = this.domSanitizer.sanitize(SecurityContext.STYLE, `.document { ${this.globalStyling()} }`);
			}

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

	// TODO: Send message + reimplement in iframe component

	drop(event: CdkDragDrop<ContentSection[]>) {
		window.parent.postMessage(
			{
				type: MessageTypes.SECTION_MOVED, sectionMoved: {
					previousIndex: event.previousIndex, currentIndex: event.currentIndex
				}
			} satisfies SectionMovedMessage, '*');
	}
}
