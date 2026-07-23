/* Client-side PDF → text for the New-Guide wizard's booking-doc upload (W4). Most real booking
   confirmations are PDFs; the wizard already parses .txt/.eml/.ics/.md/.csv. This extracts a PDF's
   text so it can feed the SAME parseBookingDocument() (model/wizard.ts) — dates/flights/lodging —
   with ZERO change to that pure parser and, crucially, the same ephemeral property: pdf.js runs
   entirely in the browser, so the file's bytes never leave the device and nothing is uploaded.

   pdf.js is heavy, so it is dynamically imported inside extractPdfText — a separate lazy chunk that
   only downloads when a traveler actually drops a PDF, never in the initial hub bundle (the config-
   gate/lazy-import doctrine the Firebase and Maps features already follow). Page- and byte-capped
   and fail-soft: on any error the caller shows "couldn't read this PDF — paste the text instead"
   rather than crashing. */

// The worker file, emitted as a separate asset and referenced by URL (Vite/astro ?url). Just a
// string here — the heavy worker code loads only when pdf.js spins the worker up on first use.
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — a booking confirmation is never bigger; refuse huge files
const MAX_PAGES = 20; // read at most this many pages; a confirmation's dates/flights are always up front

// Pure: is this file too big to bother reading in the browser? Exported so the size guard is
// testable without pdf.js or a real PDF.
export function isTooBig(bytes: number): boolean {
  return bytes > MAX_BYTES;
}

interface PdfTextItem {
  str?: string;
}

export async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  if (isTooBig(buf.byteLength)) {
    throw new Error("PDF is too large to read in the browser — paste the text instead.");
  }
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages = Math.min(doc.numPages, MAX_PAGES);
  const parts: string[] = [];
  for (let n = 1; n <= pages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    parts.push(content.items.map((it) => ((it as PdfTextItem).str ?? "")).join(" "));
  }
  return parts.join("\n").trim();
}
