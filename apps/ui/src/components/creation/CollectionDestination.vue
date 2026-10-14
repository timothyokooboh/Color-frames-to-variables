<script setup lang="ts">
import { computed } from 'vue'
import type { CollectionOption } from '@color-frames/contracts'
const props = defineProps<{
  collections: readonly CollectionOption[]
  selected: string
  customName: string
  error: string
  disabled: boolean
  loading: boolean
}>()
const emit = defineEmits<{ select: [value: string]; rename: [value: string]; reload: [] }>()
const hasColors = computed(() => props.collections.some(({ name }) => name === 'Colors'))
const options = computed(() =>
  props.collections.map((collection) => ({
    ...collection,
    label: `${collection.name === 'Colors' ? 'Colors (Existing)' : collection.name}${props.collections.filter(({ name }) => name === collection.name).length > 1 ? ` — ${collection.id}` : ''}`,
  })),
)
</script>

<template>
  <section class="space-y-2" aria-labelledby="destination-title">
    <h2 id="destination-title" class="text-sm font-semibold">Destination collection</h2>
    <label for="destination" class="block text-xs"
      ><span>Collection</span>
      <select
        id="destination"
        :value="selected"
        :disabled="disabled || loading"
        :aria-invalid="Boolean(error)"
        aria-describedby="destination-error"
        class="w-full rounded-md border border-input bg-background p-2 text-sm aria-invalid:border-destructive"
        @change="emit('select', ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>
          {{ loading ? 'Loading collections…' : 'Select a collection' }}
        </option>
        <option v-if="!hasColors" value="new:colors">Colors (Create new)</option>
        <option v-for="option in options" :key="option.id" :value="`existing:${option.id}`">
          {{ option.label }}
        </option>
        <option value="new:custom">Create new collection…</option>
      </select>
    </label>
    <label v-if="selected === 'new:custom'" for="collection-name" class="block text-xs"
      ><span>New collection name</span>
      <input
        id="collection-name"
        type="text"
        :value="customName"
        :disabled="disabled"
        :aria-invalid="Boolean(error)"
        aria-describedby="destination-error"
        class="w-full rounded-md border border-input bg-background p-2 text-sm aria-invalid:border-destructive"
        @input="emit('rename', ($event.target as HTMLInputElement).value)"
      />
    </label>
    <p id="destination-error" class="text-xs text-destructive" role="status">{{ error }}</p>
    <button
      type="button"
      :disabled="disabled || loading"
      class="text-xs underline disabled:opacity-50"
      @click="emit('reload')"
    >
      Refresh collections
    </button>
  </section>
</template>
