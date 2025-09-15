import {
	Component,
	computed,
	effect,
	ElementRef,
	inject,
	input,
	OnDestroy,
	output,
	Renderer2,
	SecurityContext,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import markdownit from 'markdown-it';
import mdMark from 'markdown-it-mark';
import { ContentSection } from '../../../types/content-section.type';
import { MessageTypes } from '../../../types/window-message.type';

@Component({
	selector: 'app-display-content-section',
	imports: [],
	templateUrl: './display-content-section.html',
	styleUrl: './display-content-section.css',
	host: {
		'(click)': 'sectionSelected()',
		'[class]': '`content-section content-section-${section().id}`',
		'[innerHTML]': 'htmlContent()',
	},
})
export class DisplayContentSection implements OnDestroy {
	private readonly elementRef = inject(ElementRef);
	private readonly renderer = inject(Renderer2);

	readonly section = input.required<ContentSection>();
	readonly sectionHovered = output<string>();

	private readonly domSanitizer = inject(DomSanitizer);
	private readonly md = markdownit({ html: true }).use(mdMark);

	readonly htmlContent = computed(() => {
		const sectionHTML: string = this.md.render(this.section().content);
		return (
			this.domSanitizer.sanitize(SecurityContext.HTML, sectionHTML) || ''
		);
	});
	private styleElement: HTMLStyleElement | null = null;

	constructor() {
		effect(() => {
			const styling = this.domSanitizer.sanitize(
				SecurityContext.STYLE,
				this.section().styling || ''
			);

			if (!this.styleElement) {
				// Create the style element once and append to document head
				this.styleElement = this.renderer.createElement('style');
				if (this.styleElement) {
					this.styleElement.setAttribute(
						'data-section-id',
						this.section().id
					);
					this.renderer.appendChild(document.head, this.styleElement);
				}
			}

			// Update the style content - we know styleElement is not null here
			if (this.styleElement) {
				this.styleElement.textContent = `.document .content-section-${
					this.section().id
				} { ${styling} }`;
			}
		});
	}

	sectionSelected() {
		console.log('selecting section in iframe: ', this.section().id);
		window.parent.postMessage(
			{
				type: MessageTypes.SECTION_SELECTED,
				sectionId: this.section().id,
			},
			'*'
		);
	}

	ngOnDestroy() {
		// Clean up the style element when component is destroyed
		if (this.styleElement && this.styleElement.parentNode) {
			this.styleElement.parentNode.removeChild(this.styleElement);
		}
	}
}
