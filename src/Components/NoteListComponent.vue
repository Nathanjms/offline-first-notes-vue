<template>
  <div class="flex flex-col flex-grow">
    <div
      v-for="note in notesStore.notes"
      :key="note.created"
      class="prose my-2 mx-auto w-full px-3 md:px-1"
    >
      <div>
        <span class="ml-1 text-xs text-gray-500"
          >Created on {{ new Date(note.created).toLocaleString() }}</span
        >
      </div>
      <div v-html="note.content"></div>
      <hr class="w-full" />
    </div>
  </div>
</template>

<script>
import { mapStores } from "pinia";
import { useNotesStore } from "../useNotesStore";

export default {
  computed: {
    ...mapStores(useNotesStore),
  },
};
</script>
