<script setup lang="ts">
defineProps<{ name: string; error: string; disabled: boolean; reviewing: boolean }>()
const emit = defineEmits<{ change: [value: string] }>()
</script>

<template>
  <section class="space-y-2" aria-labelledby="destination-title">
    <h2 id="destination-title" class="text-sm font-semibold">New collection</h2>
    <label for="collection-name" class="block text-xs"
      ><span>Collection name</span>
      <input
        id="collection-name"
        :value="name"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        aria-describedby="collection-help collection-error"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        @input="emit('change', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <p id="collection-help" class="text-xs text-muted-foreground">
      Variables will use their full paths below in this collection’s default mode.
    </p>
    <p id="collection-error" class="text-xs" role="status">
      {{ error || (reviewing ? 'Checking destination and names…' : '') }}
    </p>
  </section>
</template>
