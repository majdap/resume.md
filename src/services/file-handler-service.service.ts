import { Injectable } from '@angular/core';
import { ContentSection } from '../types/content-section.type';


@Injectable({
	providedIn: 'root',
})
export class FileHandlerService {
	saveToFile({globalStyles, sections}: {globalStyles: string, sections: ContentSection[]}) {
		const data = JSON.stringify({globalStyles, sections}, null, 2);
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'resume.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	loadFromFile(): Promise<{globalStyles: string, sections: ContentSection[]}> {
		return new Promise((resolve, reject) => {
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.json';
			input.onchange = () => {
				const file = input.files?.[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = () => {
						try {
							const { globalStyles, sections } = JSON.parse(reader.result as string);
							if (Array.isArray(sections) && sections.every(s => 'id' in s && 'content' in s)) {
								resolve({ globalStyles, sections });
							} else {
								reject(new Error('Invalid file format.'));
							}
						} catch (e) {
							reject(new Error('Error parsing file.'));
						}
					};
					reader.readAsText(file);
				} else {
					reject(new Error('No file selected.'));
				}
			};
			input.click();
		});
	}
}