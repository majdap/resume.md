# Understanding `server.ts`: The Engine Behind CV Generation

This document provides a detailed explanation of the `src/server.ts` file, its role in the CV Editor application, and how it interacts with other parts of the project to generate PDF documents.

## High-Level Overview

`server.ts` is a Node.js server built using the Express framework. Its primary responsibilities are:

1.  **Server-Side Rendering (SSR):** It renders the Angular application on the server for initial page loads, which can improve performance and SEO.
2.  **Serving Static Assets:** It serves the compiled JavaScript, CSS, and other assets of the Angular application to the browser.
3.  **Dynamic PDF Generation:** It provides an API endpoint (`/api/export/pdf`) that takes CV content in Markdown format, renders it into a styled HTML page using a headless browser (Puppeteer), and converts that page into a PDF document.

---

## Core Technologies Used

-   **Express.js:** A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
-   **Angular SSR:** Enables rendering Angular applications on the server. The `@angular/ssr` package provides the necessary tools to integrate with a Node.js server like Express.
-   **Puppeteer:** A Node.js library which provides a high-level API to control headless Chrome or Chromium. It's used here to programmatically render a web page and print it to PDF.
-   **markdown-it:** A fast and extensible Markdown parser. It's used to convert the user's Markdown input into HTML.

---

## Detailed Breakdown of `server.ts`

### 1. Imports and Initial Setup

```typescript
import { AngularNodeAppEngine, ... } from '@angular/ssr/node';
import express from 'express';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import puppeteer, { Browser } from 'puppeteer';
import markdownit from 'markdown-it';
import mdMark from 'markdown-it-mark';

const md = markdownit().use(mdMark);
const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();
const angularApp = new AngularNodeAppEngine();
let sharedBrowser: Browser | null = null;
```

-   **Express & Angular SSR:** Imports the necessary modules to create an Express server and integrate it with Angular's server-side rendering engine.
-   **Puppeteer & Markdown-it:** Imports the libraries for headless browser control and Markdown parsing.
-   **Initialization:**
    -   An instance of `markdown-it` is created.
    -   The path to the compiled browser assets (`browserDistFolder`) is determined.
    -   An Express `app` is created.
    -   A shared Puppeteer `Browser` instance is declared to avoid the overhead of launching a new browser for every request.

### 2. The PDF Export Endpoint: `/api/export/pdf`

This is the most complex part of the file. It's an asynchronous POST endpoint that orchestrates the PDF generation.

```typescript
app.post("/api/export/pdf", express.json({ limit: "1mb" }), async (req, res, next) => {
	// ... implementation ...
});
```

Here is the step-by-step flow of the request:

1.  **Receive Data:** The endpoint receives an array of `sections` in the request body. Each section contains content written in Markdown.

2.  **Launch Puppeteer:** It calls `getBrowser()` to get a running Puppeteer browser instance and opens a new `page`.

3.  **Navigate to Preview Page:**

    ```typescript
    const url = `${baseUrl}/preview?print=1`;
    await page.goto(url, {
    	waitUntil: "networkidle0", // Wait for all network activity to cease
    	timeout: 60000,
    });
    await page.emulateMediaType("print");
    ```

    -   Crucially, it navigates to the `/preview` URL, not the main application page. The `/preview` route in Angular is designed to show _only_ the CV content, without the editor UI.
    -   `waitUntil: 'networkidle0'` ensures the page (including all CSS and fonts) is fully loaded before proceeding.
    -   `emulateMediaType('print')` applies the print-specific CSS styles (`@media print`).

4.  **Process and Inject Content:**

    ```typescript
    const processedSections = sections.map((section) => ({
    	...section,
    	content: md.render(section.content), // Convert Markdown to HTML
    }));

    await page.evaluate(/*... javascript to run in the browser ...*/);
    ```

    -   The server first converts all Markdown content to HTML.
    -   It then uses `page.evaluate()` to execute JavaScript code _within the context of the browser page_. This script finds the `<app-content-display>` element and injects the generated HTML into it.

5.  **Generate and Return PDF:**

    ```typescript
    const pdf = await page.pdf({
    	printBackground: true,
    	preferCSSPageSize: true,
    	margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.end(pdf);
    ```

    -   `page.pdf()` tells Puppeteer to print the current page to a PDF buffer. The options ensure that CSS-defined page sizes and backgrounds are respected.
    -   Finally, the Express server sets the appropriate HTTP headers and sends the generated PDF back to the client that made the request.

### 3. Angular Integration and Static Serving

```typescript
/**
 * Serve static files from /browser
 */
app.use(express.static(browserDistFolder, { ... }));

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
```

-   The first `app.use` directive tells Express to serve the static files (JS, CSS, images) for the Angular application from the `dist/cv-editor/browser` directory.
-   The second `app.use` is the catch-all for Server-Side Rendering. Any request that doesn't match the `/api/export/pdf` endpoint or a static file will be handled by the Angular engine, which renders the appropriate component as HTML and sends it to the browser.

---

## How It All Works Together: The Big Picture

The `server.ts` file is the bridge between your front-end Angular application and powerful back-end capabilities like PDF generation.

1.  **User Interaction:** A user on the main page (`/`) of the CV editor clicks the "Export PDF" button.
2.  **API Request:** The Angular application's front-end code gathers all the content from the various text areas and sends it to the back-end via an HTTP POST request to `/api/export/pdf`.
3.  **Server-Side Processing:** The Express server, running the code in `server.ts`, receives this request.
4.  **Headless Rendering:** The `/api/export/pdf` endpoint uses Puppeteer to open a new, invisible browser tab and navigates to the `/preview` page. This page is a lightweight version of your app, designed only to display the CV content with the correct styling.
5.  **Content Injection:** The server injects the user's content (now converted to HTML) into this preview page.
6.  **PDF Creation:** Puppeteer generates a PDF of the fully rendered preview page.
7.  **Response:** The server sends this PDF back to the user's browser, which then prompts them to save or open the file.

This architecture effectively separates the concerns of the application: the Angular front-end handles the user interface and editing experience, while the Node.js/Express back-end handles the heavy lifting of file conversion and generation.
