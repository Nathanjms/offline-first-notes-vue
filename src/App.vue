<template>
  <div class="flex w-screen h-screen text-gray-700">
    <div
      v-if="isOffline"
      class="w-full absolute top-0 left-0 z-10 opacity-75 text-center py-2 bg-red-300 border-b border-red-500 text-red-700"
    >
      Sorry, it looks like you're offline.
    </div>
    <div
      class="flex flex-col flex-shrink-0 w-64 border-r border-gray-300 bg-gray-100"
    >
      <!-- Sidebar -->
      <div class="h-0 overflow-auto flex-grow">
        <div class="flex items-center h-8 px-3 group mt-4">
          <div class="flex items-center flex-grow focus:outline-none">
            <a
              class="ml-2 leading-none font-medium text-sm"
              href="#"
              @click.prevent="showAllNotes"
              >All Notes</a
            >
          </div>
          <button @click="addNewNote">
            <svg
              class="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
        <div class="mt-4">
          <a
            @click.prevent="openNote(note)"
            class="flex items-center h-8 text-sm pl-8 pr-3"
            :class="activeNote.created === note.created ? 'bg-gray-300' : ''"
            href="#"
            v-for="note in notes"
            :key="note.created"
          >
            <span class="ml-2 leading-none">{{
              new Date(note.created).toLocaleString()
            }}</span>
          </a>
        </div>
      </div>
    </div>
    <div
      v-if="Object.keys(this.activeNote).length"
      class="flex flex-col flex-grow"
    >
      <div class="flex flex-col flex-grow overflow-auto">
        <editor-content :editor="editor" />
      </div>
      <div class="h-16 bg-gray-100 border-t border-gray-300 text-right">
        <button
          @click="saveNote"
          class="p-2 m-2 rounded-lg bg-gray-200 hover:bg-slate-400"
        >
          Save Note
        </button>
      </div>
    </div>
    <div v-else class="flex flex-col flex-grow">
      <div v-for="note in notes" :key="note.created">
        <div class="flex p-4 pt-3">
          <div class="prose my-2 mx-auto">
            <div>
              <span class="ml-1 text-xs text-gray-500"
                >Created on {{ new Date(note.created).toLocaleString() }}</span
              >
            </div>
            <div v-html="note.content"></div>
          </div>
        </div>
        <hr class="w-full" />
      </div>
    </div>
  </div>
</template>

<script>
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
export default {
  name: "App",
  components: {
    EditorContent,
  },
  data() {
    return {
      editor: null,
      database: null,
      notes: [],
      activeNote: {},
      isOffline: !navigator.onLine,
    };
  },
  async created() {
    this.database = await this.getDatabase();
    let notes = await this.getNotes();
    this.notes = notes.reverse();
  },
  mounted() {
    this.editor = new Editor({
      content: "",
      extensions: [StarterKit],
      editorProps: {
        attributes: {
          class: "prose my-6 mx-auto focus:outline-none",
        },
      },
    });

    window.addEventListener("offline", () => {
      this.isOffline = true;
    });
    window.addEventListener("online", () => {
      this.isOffline = false;
      // sync up a user's data with an external api
      this.syncUserData();
    });
  },
  beforeUnmount() {
    this.editor.destroy();
  },
  methods: {
    async getDatabase() {
      return new Promise((resolve, reject) => {
        let db = window.indexedDB.open("notes", 2);

        db.onerror = () => {
          reject("Error opening the database.");
        };

        db.onsuccess = (e) => {
          console.log("db.onsuccess", e);
          resolve(e.target.result);
        };

        db.onupgradeneeded = (e) => {
          console.log("db.onupgradeneeded", e);
          if (e.target.result.objectStoreNames.contains("notes")) {
            e.target.result.deleteObjectStore("notes");
          }
          e.target.result.createObjectStore("notes", { keyPath: "created" });
        };
      });
    },
    async saveNote() {
      return new Promise((resolve, reject) => {
        let noteStore = this.database
          .transaction("notes", "readwrite")
          .objectStore("notes");
        let noteRequest = noteStore.get(this.activeNote.created);

        noteRequest.onerror = () => {
          reject("Error getting note from DB.");
        };

        noteRequest.onsuccess = (e) => {
          let note = e.target.result;
          note.content = this.editor.getHTML();

          let updateRequest = noteStore.put(note);

          updateRequest.onerror = () => {
            reject("Error saving note to DB.");
          };

          updateRequest.onsuccess = () => {
            let noteIndex = this.notes.findIndex(
              (x) => x.created == note.created
            );
            if (noteIndex) {
              this.notes[noteIndex] = note;
            }
            resolve();
          };
        };
      });
    },
    async createNewNote() {
      return new Promise((resolve) => {
        let transaction = this.database.transaction("notes", "readwrite");
        transaction.oncomplete = () => {
          resolve();
          console.log("resolve");
        };

        console.log("create");
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
    async getNotes() {
      return new Promise((resolve) => {
        this.database
          .transaction("notes")
          .objectStore("notes")
          .getAll().onsuccess = (e) => {
          console.log("getNotes()", e.target.result);
          resolve(e.target.result);
        };
      });
    },
    openNote(note) {
      this.activeNote = note;
      this.editor.commands.setContent(note.content);
    },
    showAllNotes() {
      this.activeNote = {};
      this.editor.commands.setContent("");
      // Then show list of notes
    },
    async addNewNote() {
      this.activeNote = {};
      this.editor.commands.setContent("");
      await this.createNewNote();
    },
    syncUserData() {
      if (this.isOffline) {
        return;
      }
      // make my api request to an external server
    },
  },
};
</script>
