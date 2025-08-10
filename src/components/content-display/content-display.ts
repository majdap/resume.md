import { Component, inject } from '@angular/core';
import { DisplayContentSection } from '../display-content-section/display-content-section';
import { ContentService } from '../../services/content-service.service';

@Component({
  selector: 'app-content-display',
  imports: [DisplayContentSection],
  templateUrl: './content-display.html',
  styleUrl: './content-display.css',
})
export class ContentDisplay {
  private readonly contentService = inject(ContentService);
  readonly sections = this.contentService.contentSections;
}
