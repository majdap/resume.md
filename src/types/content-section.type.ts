export type ContentSection = {
	id: string;
	content: string;
	styling?: string;
};

export enum ContentSectionProperty {
	CONTENT = 'content',
	STYLING = 'styling',
}
