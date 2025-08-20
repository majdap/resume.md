import {
	Component,
	computed,
	effect,
	ElementRef,
	HostListener,
	inject,
	input,
	output,
	Renderer2,
	SecurityContext,
	signal,
} from '@angular/core';
import markdownit from 'markdown-it';
import mdMark from 'markdown-it-mark';
import { DomSanitizer } from '@angular/platform-browser';
import { ContentSection } from '../../../types/content-section.type';

@Component({
	selector: 'app-display-content-section',
	imports: [],
	templateUrl: './display-content-section.html',
	styleUrl: './display-content-section.css',
})
export class DisplayContentSection {
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
				// Create the style element once
				this.styleElement = this.renderer.createElement('style');
				this.renderer.appendChild(
					this.elementRef.nativeElement,
					this.styleElement
				);
			}

			// Update the style content - we know styleElement is not null here
			if (this.styleElement) {
				this.styleElement.textContent = `.content-section-${this.section().id
					} { ${styling} }`;
			}
		});
	}
}
