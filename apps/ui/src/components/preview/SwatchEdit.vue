<script setup lang="ts">
import { useId } from 'vue'
import type { ProposedItem, ReviewedItem } from '@color-frames/contracts'
defineProps<{ item: ProposedItem; reviewed?: ReviewedItem | undefined; disabled: boolean }>()
const emit = defineEmits<{
  edit: [change: Partial<Pick<ProposedItem, 'relativeName' | 'included'>>]
}>()
const id = useId()
</script>

<template>
  <div class="space-y-2">
    <label :for="`${id}-include`" class="flex items-center gap-2 text-xs">
      <input
        :id="`${id}-include`"
        type="checkbox"
        :checked="item.included"
        :disabled="disabled"
        @change="emit('edit', { included: ($event.target as HTMLInputElement).checked })"
      />Include variable
    </label>
    <label :for="`${id}-name`" class="block text-xs"
      ><span>Variable name</span>
      <input
        :id="`${id}-name`"
        type="text"
        :value="item.relativeName"
        :disabled="disabled || !item.included"
        :aria-invalid="Boolean(reviewed?.message)"
        :aria-describedby="`${id}-status`"
        class="w-full rounded-md border border-input bg-background px-2 py-1 text-sm aria-invalid:border-destructive"
        @input="emit('edit', { relativeName: ($event.target as HTMLInputElement).value })"
      />
    </label>
    <p v-if="reviewed" class="whitespace-pre-wrap break-words text-xs">
      Full variable path: {{ reviewed.fullPath }}
    </p>
    <p
      :id="`${id}-status`"
      class="text-xs"
      :class="
        reviewed?.message
          ? 'text-destructive'
          : reviewed?.status === 'ready'
            ? 'text-success'
            : 'text-muted-foreground'
      "
    >
      {{
        !item.included
          ? 'Excluded from this batch.'
          : reviewed?.message || (reviewed ? 'Ready to create' : 'Checking name and path…')
      }}
    </p>
  </div>
</template>
