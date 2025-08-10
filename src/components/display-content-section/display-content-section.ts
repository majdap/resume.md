import {
  Component,
  computed,
  inject,
  input,
  SecurityContext,
} from '@angular/core';
import { ContentService } from '../../services/content-service.service';
import markdownit from 'markdown-it';
import mdMark from 'markdown-it-mark';
import { DomSanitizer } from '@angular/platform-browser';
import { ContentSection } from '../../types/content-section.type';

@Component({
  selector: 'app-display-content-section',
  imports: [],
  templateUrl: './display-content-section.html',
  styleUrl: './display-content-section.css',
})
export class DisplayContentSection {
  readonly section = input.required<ContentSection>();

  private readonly domSanitizer = inject(DomSanitizer);
  private readonly md = markdownit().use(mdMark);
  readonly htmlContent = computed(() => {
    const sectionHTML: string = this.md.render(this.section().content);
    return this.domSanitizer.sanitize(SecurityContext.HTML, sectionHTML) || '';
  });
}
