<script setup lang="ts">
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from 'reka-ui'
defineProps<{ open: boolean }>()
const emit = defineEmits<{ cancel: []; confirm: []; restoreFocus: [] }>()
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="!$event && emit('cancel')">
    <AlertDialogPortal>
      <AlertDialogOverlay class="fixed inset-0 z-40 bg-black/60" />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-lg border border-border bg-background p-5 text-foreground shadow-xl"
        @close-auto-focus.prevent="emit('restoreFocus')"
      >
        <AlertDialogTitle class="text-sm font-semibold">Discard preview edits?</AlertDialogTitle>
        <AlertDialogDescription class="text-sm text-muted-foreground"
          >Refreshing reads the current selection and discards your proposed names and exclusions.
          Source layers stay unchanged.</AlertDialogDescription
        >
        <div class="flex flex-wrap justify-end gap-2">
          <AlertDialogCancel class="rounded-md border border-input px-3 py-2 text-sm"
            >Keep edits</AlertDialogCancel
          >
          <AlertDialogAction
            class="rounded-md bg-destructive px-3 py-2 text-sm text-destructive-foreground"
            @click="emit('confirm')"
            >Discard and refresh</AlertDialogAction
          >
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
