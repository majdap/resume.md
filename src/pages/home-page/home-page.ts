import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content-service.service';
import { ContentSection } from '../../components/content-section/content-section';
import { Header } from "../../components/header/header";
import { ContentDisplay } from "../../components/content-display/content-display";

@Component({
  selector: 'app-home-page',
  imports: [ContentSection, Header, ContentDisplay],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
	private contentService = inject(ContentService);
	readonly contentSections = this.contentService.contentSections;

	addSection() {
		this.contentService.createContentSection();
	}
}
