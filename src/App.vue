<template>
  <div class="flex w-screen h-screen text-gray-700">
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
    <div class="flex flex-col flex-grow">
      <!-- Main Content -->
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
      if (Object.keys(this.activeNote).length) {
        console.log("update instead");
      }
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
    addNewNote() {
      this.activeNote = {};
      this.editor.commands.setContent("");
    },
  },
};
</script>
