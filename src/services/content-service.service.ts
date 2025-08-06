import { Injectable, signal } from '@angular/core';
import { ContentSection } from '../types/content-section.type';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
	contentSections = signal<ContentSection[]>([]);

	createContentSection() {
		const newSection: ContentSection = {
			id: uuidv4(),
			content: ''
		};
		this.contentSections.update(sections => [...sections, newSection]);
	}

	removeContentSection(sectionId: string) {
		this.contentSections.update(sections => sections.filter(section => section.id !== sectionId));
	}

	updateContentSection(sectionId: string, content: string) {
		console.log('Updating content section:', sectionId, content);
		this.contentSections.update(sections =>
			sections.map(section =>
				section.id === sectionId ? { ...section, content } : section
			)
		);
	}
}
