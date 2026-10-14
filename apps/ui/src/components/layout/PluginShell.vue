<script setup lang="ts">
defineProps<{ title: string }>()
defineSlots<{ default(): unknown; footer?(): unknown }>()
</script>

<template>
  <div class="flex h-dvh flex-col bg-background text-foreground">
    <header class="shrink-0 border-b border-border px-5 py-4">
      <h1 class="text-base font-semibold">{{ title }}</h1>
    </header>
    <main class="min-h-0 flex-1 overflow-auto p-5">
      <slot />
    </main>
    <footer v-if="$slots.footer" class="shrink-0 border-t border-border px-5 py-4">
      <slot name="footer" />
    </footer>
  </div>
</template>
