<script setup lang="ts">
defineProps<{ title: string }>()
defineSlots<{ default(): unknown; footer?(): unknown }>()
</script>

<template>
  <div class="flex h-dvh flex-col bg-background text-foreground">
    <header class="shrink-0 border-b border-border bg-accent/50 px-4 py-3">
      <div class="flex items-center gap-2">
        <span aria-hidden="true" class="flex gap-0.5">
          <span class="h-4 w-2 rounded-full bg-indigo-400" />
          <span class="h-4 w-2 rounded-full bg-violet-400" />
          <span class="h-4 w-2 rounded-full bg-pink-400" />
        </span>
        <h1 class="text-sm font-semibold">{{ title }}</h1>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">Your palette, ready for variables.</p>
    </header>
    <main class="min-h-0 flex-1 overflow-auto p-4">
      <slot />
    </main>
    <footer v-if="$slots.footer" class="shrink-0 border-t border-border px-5 py-4">
      <slot name="footer" />
    </footer>
  </div>
</template>
