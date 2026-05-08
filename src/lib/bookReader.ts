import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import ePub from "epubjs";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { BookRecord } from "@/lib/db";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface BookChunk {
  index: number;
  total: number;
  label: string; // e.g. "Page 4" or chapter title
  text: string;
}

export interface BookHandle {
  totalChunks: number;
  getChunk: (i: number) => Promise<BookChunk>;
}

export async function openBook(rec: BookRecord): Promise<BookHandle> {
  const buf = await rec.data.arrayBuffer();
  if (rec.type === "pdf") return openPdf(buf);
  return openEpub(buf);
}

async function openPdf(buf: ArrayBuffer): Promise<BookHandle> {
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const total = pdf.numPages;
  return {
    totalChunks: total,
    getChunk: async (i: number) => {
      const pageNum = Math.min(Math.max(1, i + 1), total);
      const page = await pdf.getPage(pageNum);
      const tc = await page.getTextContent();
      // Build text with naive paragraph breaks based on Y-position deltas.
      let text = "";
      let lastY: number | null = null;
      for (const item of tc.items as Array<{ str: string; transform: number[]; hasEOL?: boolean }>) {
        const y = item.transform?.[5] ?? null;
        if (lastY !== null && y !== null && Math.abs(y - lastY) > 12) text += "\n\n";
        else if (item.hasEOL) text += " ";
        text += item.str;
        lastY = y;
      }
      return {
        index: pageNum - 1,
        total,
        label: `Page ${pageNum} of ${total}`,
        text: text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
      };
    },
  };
}

async function openEpub(buf: ArrayBuffer): Promise<BookHandle> {
  const book = ePub(buf);
  await book.ready;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spineItems: any[] = (book.spine as unknown as { spineItems: any[] }).spineItems;
  const total = spineItems.length;
  return {
    totalChunks: total,
    getChunk: async (i: number) => {
      const idx = Math.min(Math.max(0, i), total - 1);
      const item = spineItems[idx];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc: Document = await item.load((book as any).load.bind(book));
      const body = doc.body || (doc as unknown as { documentElement: HTMLElement }).documentElement;
      const text = (body?.textContent ?? "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      item.unload?.();
      return {
        index: idx,
        total,
        label: `Section ${idx + 1} of ${total}`,
        text,
      };
    },
  };
}

export function useBook(rec: BookRecord | null) {
  const [handle, setHandle] = useState<BookHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!rec) return;
    let alive = true;
    setHandle(null);
    setError(null);
    openBook(rec)
      .then((h) => alive && setHandle(h))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [rec]);
  return { handle, error };
}
