import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import FormData from 'form-data';

import markdownit from 'markdown-it';
import mdMark from 'markdown-it-mark';

const md = markdownit({ html: true }).use(mdMark);
// Serve built browser assets (Angular outputs them under ../browser relative to server bundle)
const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// PDF export endpoint: renders the app's print view and returns a vector PDF using Gotenberg
app.post(
	'/api/export/pdf',
	express.json({ limit: '1mb' }),
	async (req, res, next) => {
		try {
			const { globalStyles, sections } = req.body as {
				globalStyles: string,
				sections: Array<{ id: string; content: string; styling: string }>;
			};

			// Pre-process content to reduce work in browser
			const processedSections = sections.map((section) => ({
				...section,
				content: md.render(section.content),
			}));

			// Generate the HTML content for PDF
			const htmlContent = generatePrintHTML(globalStyles, processedSections);

			// Send HTML to Gotenberg for PDF conversion
			const gotenbergUrl = process.env['GOTENBERG_URL'] || 'http://localhost:3000';
			
			// Create form data for Gotenberg
			const form = new FormData();
			
			// Add HTML content
			form.append('files', Buffer.from(htmlContent), {
				filename: 'index.html',
				contentType: 'text/html'
			});
			
			// Configure PDF options
			form.append('marginTop', '0.5');
			form.append('marginBottom', '0.5');
			form.append('marginLeft', '0.5');
			form.append('marginRight', '0.5');
			form.append('paperWidth', '8.27');
			form.append('paperHeight', '11.7');
			form.append('preferCssPageSize', 'false');
			form.append('printBackground', 'true');
			form.append('scale', '1');

			// Send request to Gotenberg
			const response = await fetch(`${gotenbergUrl}/forms/chromium/convert/html`, {
				method: 'POST',
				body: form as any,
				headers: form.getHeaders(),
			});

			if (!response.ok) {
				throw new Error(`Gotenberg error: ${response.status} ${response.statusText}`);
			}

			// Stream the PDF response
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'inline; filename="cv.pdf"');
			
			const pdfBuffer = await response.arrayBuffer();
			res.send(Buffer.from(pdfBuffer));

		} catch (error) {
			console.error('PDF generation error:', error);
			res.status(500).json({ error: 'Failed to generate PDF' });
		}
	}
);

// Generate HTML content for PDF rendering
function generatePrintHTML(globalStyles: string, sections: Array<{ id: string; content: string; styling: string }>): string {
	const sectionHTML = sections.map(section => `
		<div class="content-section" data-section-id="${section.id}">
			<style scoped>
				${section.styling}
			</style>
			<div class="section-content">
				${section.content}
			</div>
		</div>
	`).join('');

	return `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>CV Export</title>
			<style>
				/* Global styles */
				${globalStyles}
				
				/* Print-specific styles */
				@media print {
					* {
						-webkit-print-color-adjust: exact !important;
						color-adjust: exact !important;
						print-color-adjust: exact !important;
					}
				}
				
				/* Base print styles */
				body {
					margin: 0;
					padding: 20px;
					font-family: 'Martian Mono', monospace;
					font-size: 12pt;
					line-height: 1.4;
					color: #000;
					background: #fff;
				}
				
				.content-section {
					margin-bottom: 1em;
					break-inside: avoid;
				}
				
				.section-content {
					/* Content styling */
				}
			</style>
		</head>
		<body>
			${sectionHTML}
		</body>
		</html>
	`;
}

/**
 * Serve static files from /browser
 */
app.use(
	express.static(browserDistFolder, {
		maxAge: '1y',
		index: false,
		redirect: false,
	})
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
	angularApp
		.handle(req)
		.then((response) =>
			response ? writeResponseToNodeResponse(response, res) : next()
		)
		.catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
	const port = process.env['PORT'] || 4000;
	app.listen(port, (error) => {
		if (error) {
			throw error;
		}

		console.log(
			`Node Express server listening on http://localhost:${port}`
		);
	});
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
