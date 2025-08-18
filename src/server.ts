import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import puppeteer, { Browser } from 'puppeteer';

import markdownit from 'markdown-it';
import mdMark from 'markdown-it-mark';

const md = markdownit({ html: true }).use(mdMark);
// Serve built browser assets (Angular outputs them under ../browser relative to server bundle)
const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
let sharedBrowser: Browser | null = null;

async function getBrowser() {
	if (sharedBrowser && sharedBrowser.isConnected()) return sharedBrowser;
	sharedBrowser = await puppeteer.launch({
		headless: true,
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--font-render-hinting=none',
			'--disable-dev-shm-usage',
		],
	});
	return sharedBrowser;
}

// PDF export endpoint: renders the app's print view and returns a vector PDF
app.post(
	'/api/export/pdf',
	express.json({ limit: '1mb' }),
	async (req, res, next) => {
		try {
			const { globalStyles, sections } = req.body as {
				globalStyles: string,
				sections: Array<{ id: string; content: string; styling: string }>;
			};
			console.log('sections: ', sections);
			console.log('globalStyles: ', globalStyles);
			const port = process.env['PORT'] || 4000;
			const baseUrl =
				process.env['PUBLIC_BASE_URL'] || `http://localhost:${port}`;

			const browser = await getBrowser();
			const page = await browser.newPage();
			page.setDefaultNavigationTimeout(60000);
			page.setDefaultTimeout(60000);
			await page.setViewport({
				width: 1024,
				height: 1366,
				deviceScaleFactor: 2,
			});

			const url = `${baseUrl}/preview?print=1`;
			await page.goto(url, {
				waitUntil: 'networkidle0',
				timeout: 60000,
			});
			await page.emulateMediaType('print');

			const processedSections = sections.map((section) => ({
				...section,
				content: md.render(section.content),
			}));
			console.log('processedSections: ', processedSections);

			// Inject content sections into the app by directly manipulating the DOM
			await page.evaluate(
				(payload: {
					sections: Array<{ id: string; content: string; styling: string }>;
					globalStyles: string;
				}) => {
					console.log("before target eval")
					const target = document.querySelector(
						'app-content-display'
					);
					if (target) {
						console.log('hello')
						const sectionsHtml = payload.sections
							.map(
								(section) =>
									`<div class="injected-section-${section.id}">${section.content}</div><style>.injected-section-${section.id} { ${section.styling} }</style>`
							)
							.join('');

						target.innerHTML = `<style>@media print {
			body {
				margin: 0 !important; /* keep intrinsic A4 width */
				width: 210mm !important; /* ensure consistency */
				height: auto !important;
				min-height: auto !important;
			}

			.document-body {
				width: 100% !important;
				height: auto !important;
				min-height: 297mm !important;
			}
			@page {
						margin: 0 !important;
						padding: 0 !important;
						}

							}</style><div class="document-body"><style>.document-body { ${payload.globalStyles} }</style>${sectionsHtml}</div>`;
					}
					else {
						console.log("target undefined");
					}
				},
				{ sections: processedSections, globalStyles }
			);
			console.log('goodbye')

			// Wait for the expected number of content sections to render
			const expected = Array.isArray(sections) ? sections.length : 0;
			if (expected > 0) {
				try {
					await page.waitForFunction(
						(count) =>
							document.querySelectorAll('.injected-section')
								.length === count,
						{ timeout: 15000 },
						expected
					);
				} catch {
					// ignore and continue; PDF can still be generated
				}
			}

			// Wait for fonts
			await page.evaluate(async () => {
				const anyDoc: any = document;
				if (anyDoc.fonts?.ready) {
					try {
						await Promise.race([
							anyDoc.fonts.ready,
							new Promise((resolve) => setTimeout(resolve, 5000)),
						]);
					} catch { }
				}
			});

			const html = await page.content();
			console.log('Rendered HTML:', html);
			await fs.writeFile('rendered-page.html', html);
			console.log('Rendered HTML saved to rendered-page.html');

			// Prefer CSS sizing (@page) and no default margins
			const pdf = await page.pdf({
				printBackground: true,
				format: 'a4',
				margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
			});

			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', 'inline; filename="cv.pdf"');
			res.end(pdf);
		} catch (err) {
			next(err);
		}
	}
);

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
