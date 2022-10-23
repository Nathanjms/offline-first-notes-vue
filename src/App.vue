<template>
  <div class="flex w-screen h-screen text-gray-700">
    <div
      v-if="isOffline"
      class="w-full absolute top-0 left-0 z-10 opacity-75 text-center py-2 bg-red-300 border-b border-red-500 text-red-700"
    >
      Sorry, it looks like you're offline.
    </div>
    <sidebar-component></sidebar-component>
    <editor-component
      v-show="Object.keys(notesStore.activeNote).length"
    ></editor-component>
    <note-list-component
      v-if="!Object.keys(notesStore.activeNote).length"
    ></note-list-component>
  </div>
</template>

<script>
import { Editor } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import SidebarComponent from "./Components/SidebarComponent.vue";
import EditorComponent from "./Components/EditorComponent.vue";
import { useNotesStore } from "./useNotesStore";
import { mapStores } from "pinia";
import NoteListComponent from "./Components/NoteListComponent.vue";

export default {
  name: "App",
  computed: {
    ...mapStores(useNotesStore),
  },
  components: {
    SidebarComponent,
    EditorComponent,
    NoteListComponent,
  },
  data() {
    return {
      isOffline: !navigator.onLine,
    };
  },
  mounted() {
    window.addEventListener("offline", () => {
      this.isOffline = true;
    });
    window.addEventListener("online", () => {
      this.isOffline = false;
      // sync up a user's data with an external api
      this.syncUserData();
    });
    this.notesStore.init();
    this.notesStore.initEditor(
      new Editor({
        content: "",
        extensions: [StarterKit],
        editorProps: {
          attributes: {
            class: "prose my-6 mx-auto focus:outline-none",
          },
        },
      })
    );
  },
  methods: {
    syncUserData() {
      if (this.isOffline) {
        return;
      }
      // make my api request to an external server
    },
  },
};
</script>
