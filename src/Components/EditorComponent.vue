<template>
  <div class="flex flex-col flex-grow">
    <div class="flex flex-col flex-grow overflow-auto mx-3 md:mx-1">
      <editor-content :editor="notesStore.$state.editor" />
    </div>
    <div class="h-16 bg-gray-100 border-t border-gray-300 text-right">
      <button
        @click="saveNote()"
        class="p-2 m-2 rounded-lg bg-gray-200 hover:bg-slate-400"
      >
        {{ saveNoteText }}
      </button>
    </div>
  </div>
</template>

<script>
import { EditorContent } from "@tiptap/vue-3";
import { mapStores } from "pinia";
import { useNotesStore } from "../useNotesStore";

export default {
  components: {
    EditorContent,
  },
  computed: {
    ...mapStores(useNotesStore),
  },
  data() {
    return {
      saveNoteText: "Save Note",
    };
  },
  beforeUnmount() {
    this.notesStore.$state.editor.destroy();
  },
  methods: {
    async saveNote() {
      await this.notesStore.saveNote();
      this.saveNoteText = "Saved!";
      setTimeout(() => {
        this.saveNoteText = "Save Note";
      }, 1000);
    },
  },
};
</script>
