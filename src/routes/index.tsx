import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { db, uid, type BookRecord } from "@/lib/db";
import { BookOpen, Upload, Trash2, FileText, BookMarked } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VibeReader — Library" },
      { name: "description", content: "Your private book library. Drop a PDF or EPUB to begin." },
    ],
  }),
  component: LibraryPage,
  ssr: false,
});

function LibraryPage() {
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const refresh = async () => {
    const all = await db.books.orderBy("addedAt").reverse().toArray();
    setBooks(all);
  };
  useEffect(() => {
    refresh();
  }, []);

  const acceptFile = async (file: File) => {
    setError(null);
    const lower = file.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf") || file.type === "application/pdf";
    const isEpub = lower.endsWith(".epub") || file.type === "application/epub+zip";
    if (!isPdf && !isEpub) {
      setError("Only .pdf and .epub files are supported.");
      return;
    }
    const id = uid();
    const rec: BookRecord = {
      id,
      title: file.name.replace(/\.(pdf|epub)$/i, ""),
      type: isPdf ? "pdf" : "epub",
      size: file.size,
      addedAt: Date.now(),
      data: file,
    };
    await db.books.put(rec);
    await refresh();
    navigate({ to: "/read/$bookId", params: { bookId: id } });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const remove = async (id: string) => {
    await db.books.delete(id);
    await refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-5xl px-6 pt-12 pb-8">
        <div className="flex items-center gap-3">
          <div className="vibe-bg h-10 w-10 rounded-xl flex items-center justify-center vibe-glow">
            <BookMarked className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">VibeReader</h1>
            <p className="text-sm text-muted-foreground">
              Read books with mood music. 100% in your browser.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 space-y-10">
        <section
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
            dragOver
              ? "border-[var(--vibe)] bg-[color-mix(in_oklab,var(--vibe)_8%,transparent)]"
              : "border-border hover:border-[var(--vibe)] hover:bg-card/60"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) acceptFile(f);
              e.target.value = "";
            }}
          />
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl vibe-bg flex items-center justify-center">
            <Upload className="h-6 w-6 text-background" />
          </div>
          <p className="font-serif text-2xl mb-1">Drop a book to begin</p>
          <p className="text-sm text-muted-foreground">
            PDF or EPUB · stored locally · never uploaded
          </p>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </section>

        <section>
          <h2 className="font-serif text-xl mb-4 text-muted-foreground">Your library</h2>
          {books.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No books yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {books.map((b) => (
                <li
                  key={b.id}
                  className="group rounded-xl border border-border bg-card p-4 hover:vibe-glow transition-all"
                >
                  <Link
                    to="/read/$bookId"
                    params={{ bookId: b.id }}
                    className="flex items-start gap-3"
                  >
                    <div className="h-12 w-10 rounded-md vibe-bg flex items-center justify-center shrink-0">
                      {b.type === "pdf" ? (
                        <FileText className="h-5 w-5 text-background" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-background" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{b.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.type.toUpperCase()} · {(b.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => remove(b.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="pt-6 text-xs text-muted-foreground border-t border-border">
          Vibe engine: <span className="vibe-text">Xenova/mobilebert-uncased-mnli</span> ·
          7 vibes · 3-second crossfade · zero servers.
        </footer>
      </main>
    </div>
  );
}
