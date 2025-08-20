import { ContentSection } from "./content-section.type";

export type ContentUpdateMessage = {
	type: MessageTypes.CONTENT_UPDATE;
	content: {
		sections: ContentSection[];
		globalStyle: string;
	}
}

export type SectionMovedMessage = {
	type: MessageTypes.SECTION_MOVED;
	sectionMoved: {
		previousIndex: number;
		currentIndex: number;
	}
}

export enum MessageTypes {
	CONTENT_UPDATE = 'CONTENT_UPDATE',
	IFRAME_READY = 'IFRAME_READ',
	SECTION_MOVED = 'SECTION_MOVED'
}
