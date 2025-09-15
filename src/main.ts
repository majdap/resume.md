import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Declare global variables loaded by scripts
declare const Prism: any;
declare const codeInput: any;

// Register code-input templates when the application starts
function registerCodeInputTemplates() {
	if (typeof codeInput !== 'undefined' && typeof Prism !== 'undefined') {
		try {
			// Register Prism template for syntax highlighting
			codeInput.registerTemplate(
				'syntax-highlighted',
				codeInput.templates.prism(Prism, [
					new codeInput.plugins.Indent(true, 2), // Enable indentation with 2 spaces
				])
			);
			console.log('Code input templates registered successfully');
			return true;
		} catch (error) {
			console.error('Error registering code input templates:', error);
			return false;
		}
	}
	return false;
}

// Initialize after a short delay to ensure all scripts are loaded
setTimeout(() => {
	registerCodeInputTemplates();
}, 100);

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
