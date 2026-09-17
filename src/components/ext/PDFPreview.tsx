import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

/** Render the download itself, including every page and its embedded fonts. */
export function PDFPreview({ blob }: { blob: Blob | null }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Preparing PDF…");

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    host.replaceChildren();
    setStatus("Preparing PDF…");
    if (!blob) return;
    let cancelled = false;
    let task: ReturnType<typeof getDocument> | undefined;
    const render = async () => {
      const data = await blob.arrayBuffer();
      if (cancelled) return;
      task = getDocument({ data, isEvalSupported: false, useSystemFonts: true });
      const pdf = await task.promise;
      const pages = document.createDocumentFragment();
      for (let number = 1; number <= pdf.numPages; number++) {
        if (cancelled) return;
        const page = await pdf.getPage(number);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.className = "mb-4 block h-auto w-full bg-white shadow-lg";
        canvas.setAttribute("aria-label", `PDF page ${number} of ${pdf.numPages}`);
        canvas.setAttribute("role", "img");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        await page.render({ canvasContext: context, viewport }).promise;
        pages.append(canvas);
      }
      if (!cancelled) {
        host.replaceChildren(pages);
        setStatus("");
      }
    };
    void render().catch(() => {
      if (!cancelled) setStatus("Could not display the PDF preview. Reopen this tab to retry.");
    });
    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [blob]);

  return <>
    {status && <p role="status" className="mb-3 text-xs text-muted-foreground">{status}</p>}
    <div ref={container} />
  </>;
}
