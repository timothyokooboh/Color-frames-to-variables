<script setup lang="ts">
import { computed, useId } from 'vue'
import type { ReviewedItem } from '@color-frames/contracts'
import { colorToCss, colorToHex } from '@/lib/color-display'
const props = defineProps<{
  conflict: NonNullable<ReviewedItem['conflict']>
  approved: boolean
  disabled: boolean
}>()
const emit = defineEmits<{ approve: [token: string | undefined] }>()
const id = useId()
const colors = computed(() =>
  [
    { label: 'Existing', color: props.conflict.existingColor },
    { label: 'Proposed', color: props.conflict.proposedColor },
  ].map(({ label, color }) => ({
    label,
    hex: color ? colorToHex(color) : 'Unresolved color',
    css: color ? colorToCss(color) : 'transparent',
  })),
)
</script>
<template>
  <div class="space-y-2 rounded-md border border-input bg-background p-2">
    <dl class="grid grid-cols-2 gap-3 text-xs">
      <div v-for="color in colors" :key="color.label">
        <dt class="text-muted-foreground">{{ color.label }}</dt>
        <dd class="mt-1 flex items-center gap-1 font-mono">
          <span
            aria-hidden="true"
            class="h-4 w-4 shrink-0 rounded border border-input"
            :style="{ backgroundColor: color.css }"
          />{{ color.hex }}
        </dd>
      </div>
    </dl>
    <label v-if="conflict.canOverwrite" :for="id" class="flex items-start gap-2 text-xs">
      <input
        :id="id"
        type="checkbox"
        :checked="approved"
        :disabled="disabled"
        @change="
          emit('approve', ($event.target as HTMLInputElement).checked ? conflict.token : undefined)
        "
      />
      Overwrite this variable’s default-mode color
    </label>
    <p v-else class="text-xs text-muted-foreground">Rename or exclude this item.</p>
  </div>
</template>
