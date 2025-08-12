import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContentService } from '../../services/content-service.service';
import { ContentSection } from '../../components/content-section/content-section';
import { Header } from '../../components/header/header';
import { ContentDisplay } from '../../components/content-display/content-display';

@Component({
  selector: 'app-home-page',
  imports: [ContentSection, Header, ContentDisplay],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  private contentService = inject(ContentService);
  private sanitizer = inject(DomSanitizer);
  readonly contentSections = this.contentService.contentSections;

  // Live preview mode: 'dom' or 'pdf'
  readonly previewMode = signal<'dom' | 'pdf'>('dom');
  readonly pdfUrl = signal<string | null>(null);
  readonly safePdfUrl = signal<SafeResourceUrl | null>(null);
  readonly showBrowserNote = signal<boolean>(false);

  addSection() {
    this.contentService.createContentSection();
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
      this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
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

  dismissBrowserNote() {
    this.showBrowserNote.set(false);
  }
}
