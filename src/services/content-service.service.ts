import { Injectable, effect, signal } from '@angular/core';
import {
	ContentSection,
	ContentSectionProperty,
} from '../types/content-section.type';
import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import { defaultStyling } from '../pages/home-page/default-styling';

@Injectable({
	providedIn: 'root',
})
export class ContentService {
	contentSections = signal<ContentSection[]>([]);
	selectedSection = signal('');
	globalStyle = signal(defaultStyling);

	printSubject = new Subject();

	constructor() {
		// Load initial state from localStorage (if any)
		try {
			const raw = (globalThis as any).localStorage?.getItem(
				'cv_sections'
			);
			if (raw) {
				const parsed: ContentSection[] = JSON.parse(raw);
				this.contentSections.set(parsed);
			}
		} catch { }

		// Persist on changes
		effect(() => {
			const sections = this.contentSections();

		});

		effect(() => {
			const selectedSection = this.selectedSection();

		})
	}

	createContentSection() {
		const newSection: ContentSection = {
			id: uuidv4(),
			content: '',
			styling: '',
		};
		this.contentSections.update((sections) => [...sections, newSection]);
	}

	removeContentSection(sectionId: string) {
		this.contentSections.update((sections) =>
			sections.filter((section) => section.id !== sectionId)
		);
	}

	updateContentSection(
		sectionId: string,
		property: ContentSectionProperty,
		value: string
	) {

		this.contentSections.update((sections) =>
			sections.map((section) =>
				section.id === sectionId
					? { ...section, [property]: value }
					: section
			)
		);
	}

	updateGlobalStyling(updatedGlobalStyle: string) {
		this.globalStyle.set(updatedGlobalStyle);
	}

	updateSectionIndex(oldIndex: number, newIndex: number) {

		this.contentSections.update(currentSections => {
			// 1. Create a new, mutable copy of the array
			const newSections = [...currentSections];

			// 2. Remove the element from the old index from the COPY
			const [movedItem] = newSections.splice(oldIndex, 1);

			// 3. Add the element to the new index in the COPY
			newSections.splice(newIndex, 0, movedItem);

			// 4. Return the new array. The signal will see a new reference and trigger effects.
			return newSections;
		});
	}

	setContentSections(sections: ContentSection[]) {
		this.contentSections.set(sections);
	}
}
