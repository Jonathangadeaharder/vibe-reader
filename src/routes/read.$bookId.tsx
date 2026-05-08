import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db, type BookRecord } from "@/lib/db";
import { useBook } from "@/lib/bookReader";
import { useVibeEngine } from "@/hooks/useVibeEngine";
import { useVibeStore } from "@/lib/vibeStore";
import { VibeBar } from "@/components/VibeBar";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/read/$bookId")({
  component: ReaderPage,
  ssr: false,
});

function ReaderPage() {
  const { bookId } = Route.useParams();
  const navigate = useNavigate();
  const [rec, setRec] = useState<BookRecord | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    db.books.get(bookId).then((r) => {
      if (r) setRec(r);
      else setMissing(true);
    });
  }, [bookId]);

  const { handle, error } = useBook(rec);
  const { classify } = useVibeEngine();
  const modelReady = useVibeStore((s) => s.modelReady);

  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [label, setLabel] = useState("");
  const [loadingChunk, setLoadingChunk] = useState(false);

  // Restore last position
  useEffect(() => {
    if (rec?.lastLocation != null && typeof rec.lastLocation === "number") {
      setIdx(rec.lastLocation);
    }
  }, [rec]);

  // Load current chunk
  useEffect(() => {
    if (!handle) return;
    let alive = true;
    setLoadingChunk(true);
    handle
      .getChunk(idx)
      .then((c) => {
        if (!alive) return;
        setText(c.text);
        setLabel(c.label);
        if (rec) db.books.update(rec.id, { lastLocation: c.index });
      })
      .finally(() => alive && setLoadingChunk(false));
    return () => {
      alive = false;
    };
  }, [handle, idx, rec]);

  // Re-classify when chunk changes (debounced) once model is ready
  useEffect(() => {
    if (!text || !modelReady) return;
    const t = setTimeout(() => classify(text), 250);
    return () => clearTimeout(t);
  }, [text, modelReady, classify]);

  if (missing) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="font-serif text-2xl mb-2">Book not found</p>
          <Link to="/" className="vibe-text underline underline-offset-4">
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  const total = handle?.totalChunks ?? 0;
  const canPrev = idx > 0;
  const canNext = idx < total - 1;

  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <div className="min-h-screen">
      <VibeBar />

      <div className="mx-auto max-w-3xl px-6 pt-6 pb-32">
        <div className="flex items-center justify-between mb-8 text-sm">
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Library
          </button>
          <div className="text-muted-foreground">
            <span className="font-serif text-foreground">{rec?.title}</span>
            {label && <span className="ml-2">· {label}</span>}
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm">Failed to open book: {error}</p>
        )}
        {!error && !handle && (
          <p className="text-muted-foreground italic">Opening book…</p>
        )}

        {handle && (
          <article className="prose-reader">
            {loadingChunk && paragraphs.length === 0 ? (
              <p className="text-muted-foreground italic">Loading…</p>
            ) : paragraphs.length === 0 ? (
              <p className="text-muted-foreground italic">
                (No extractable text on this page.)
              </p>
            ) : (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            )}
          </article>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 backdrop-blur-xl bg-background/80 border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center gap-3">
          <button
            disabled={!canPrev}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm border border-border hover:bg-secondary transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <div className="flex-1 text-center text-xs text-muted-foreground">
            {total > 0 ? `${idx + 1} / ${total}` : ""}
          </div>
          <button
            disabled={!canNext}
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm vibe-bg text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </div>
  );
}
