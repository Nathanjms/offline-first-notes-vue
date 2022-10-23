import { defineStore } from "pinia";

export const useNotesStore = defineStore("notes", {
  state: () => ({
    editor: null,
    database: null,
    notes: [],
    activeNote: {},
    isOffline: !navigator.onLine,
  }),
  //   getters: {},
  actions: {
    async init() {
      await this.initialiseDatabase();
      await this.initNotes();
    },
    async initialiseDatabase() {
      return new Promise((resolve, reject) => {
        let db = window.indexedDB.open("notes", 2);

        db.onerror = () => {
          console.error("Error opening the database.");
          reject(":c reject");
        };

        db.onsuccess = (e) => {
          this.database = e.target.result;
          resolve();
        };

        db.onupgradeneeded = (e) => {
          if (e.target.result.objectStoreNames.contains("notes")) {
            e.target.result.deleteObjectStore("notes");
          }
          e.target.result.createObjectStore("notes", { keyPath: "created" });
        };
      });
    },
    async initNotes() {
      this.database
        .transaction("notes")
        .objectStore("notes")
        .getAll().onsuccess = (e) => {
        this.notes = e.target.result.reverse();
      };
    },
    async saveNote() {
      let noteStore = this.database
        .transaction("notes", "readwrite")
        .objectStore("notes");
      let noteRequest = await noteStore.get(this.activeNote.created);

      noteRequest.onerror = () => {
        console.error("Error getting note from DB.");
      };

      noteRequest.onsuccess = async (e) => {
        let note = e.target.result;
        note.content = this.editor.getHTML();

        let updateRequest = await noteStore.put(note);

        updateRequest.onerror = () => {
          console.error("Error saving note to DB.");
        };

        updateRequest.onsuccess = () => {
          let noteIndex = this.notes.findIndex(
            (x) => x.created == note.created
          );
          if (noteIndex !== -1) {
            this.notes[noteIndex] = note;
          }
        };
      };
    },
    setActiveNote(note) {
      this.activeNote = note;
    },
    setEditorContent(content) {
      this.editor.commands.setContent(content);
    },
    async createNewNote() {
      return new Promise((resolve) => {
        let transaction = this.database.transaction("notes", "readwrite");
        transaction.oncomplete = () => {
          resolve();
        };

        let now = new Date();
        let note = {
          content: this.editor.getHTML(),
          created: now.getTime(),
        };

        this.notes.unshift(note);
        this.activeNote = note;
        transaction.objectStore("notes").add(note);
      });
    },
    initEditor(editorConfig) {
      this.editor = editorConfig;
    },
    setIsOffline(is) {
      this.isOffline = is;
    },
  },
});
