import Dexie, { type Table } from "dexie";

export interface BookRecord {
  id: string;
  title: string;
  type: "pdf" | "epub";
  size: number;
  addedAt: number;
  data: Blob;
  lastLocation?: string | number;
}

class VibeDB extends Dexie {
  books!: Table<BookRecord, string>;
  constructor() {
    super("vibereader");
    this.version(1).stores({
      books: "id, title, addedAt",
    });
  }
}

export const db = new VibeDB();

export const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);
