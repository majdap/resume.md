import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import puppeteer, { Browser } from 'puppeteer';

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
      const { sections } = req.body as {
        sections: Array<{ id: string; content: string }>;
      };
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

      // Navigate to base app (home route) in a print-only mode via query param
      const url = `${baseUrl}/?print=1`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.emulateMediaType('print');

      // Inject content sections into the app via localStorage and trigger a refresh
      await page.evaluate(
        (payload: { sections: Array<{ id: string; content: string }> }) => {
          // Store raw markdown sections; the app will render markdown to HTML client-side
          localStorage.setItem(
            'cv_sections',
            JSON.stringify(payload.sections || [])
          );
        },
        { sections }
      );

      // Reload to let app read localStorage on start
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });

      // Wait for the expected number of content sections to render
      // Wait for Angular components to appear; if count doesn't match, proceed anyway
      try {
        await page.waitForSelector('app-content-display', { timeout: 15000 });
      } catch {}
      const expected = Array.isArray(sections) ? sections.length : 0;
      if (expected > 0) {
        try {
          await page.waitForFunction(
            (count) =>
              document.querySelectorAll('app-display-content-section')
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
          } catch {}
        }
      });

      // Prefer CSS sizing (@page) and no default margins
      const pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
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

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
