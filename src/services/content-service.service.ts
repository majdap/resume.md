import { Injectable, effect, signal } from '@angular/core';
import {
	ContentSection,
	ContentSectionProperty,
} from '../types/content-section.type';
import { v4 as uuidv4 } from 'uuid';

/**
 * ContentService manages CV content sections and global styling.
 * 
 * Note: When used in an iframe architecture, each browsing context
 * (main app and iframe) will have separate instances of this service,
 * even though it's marked as providedIn: 'root'. This is expected
 * behavior and communication between instances should use postMessage.
 * 
 * @see docs/iframe-service-architecture.md for detailed explanation
 */
@Injectable({
	providedIn: 'root',
})
export class ContentService {
	contentSections = signal<ContentSection[]>([]);
	globalStyle = signal('');
	
	// Add a unique instance ID to track service instances
	private instanceId = Math.random().toString(36).substr(2, 9);
	
	constructor() {
		console.log(`ContentService instance created with ID: ${this.instanceId}`);
		console.log('ContentService context:', this.getExecutionContext());
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
			try {
				(globalThis as any).localStorage?.setItem(
					'cv_sections',
					JSON.stringify(sections)
				);
			} catch { }
		});
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
		console.log(`[${this.instanceId}] Updating content section:`, sectionId, property, value);
		this.contentSections.update((sections) =>
			sections.map((section) =>
				section.id === sectionId
					? { ...section, [property]: value }
					: section
			)
		);
	}

	updateGlobalStyling(updatedGlobalStyle: string) {
		console.log(`[${this.instanceId}] Updated new styles in the service:`, updatedGlobalStyle);
		this.globalStyle.set(updatedGlobalStyle);
	}
	
	getInstanceId(): string {
		return this.instanceId;
	}
	
	/**
	 * Get execution context information for debugging
	 * Helps identify whether service is running in main app or iframe
	 */
	getExecutionContext(): string {
		if (typeof window === 'undefined') {
			return 'server';
		}
		
		// Check if we're in an iframe
		const isInIframe = window !== window.parent;
		return isInIframe ? 'iframe' : 'main-app';
	}
	
	/**
	 * Debug method to log current service state
	 * Useful for troubleshooting cross-frame communication
	 */
	debugServiceState(): void {
		console.log('=== ContentService Debug Info ===');
		console.log('Instance ID:', this.instanceId);
		console.log('Execution Context:', this.getExecutionContext());
		console.log('Content Sections:', this.contentSections().length);
		console.log('Global Style Length:', this.globalStyle().length);
		console.log('================================');
	}
}
