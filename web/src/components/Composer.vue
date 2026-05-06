<script setup lang="ts">
import { ref } from 'vue';
import { ArrowUp, Square } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

const props = defineProps<{ busy: boolean; disabled?: boolean }>();
const emit = defineEmits<{
  send: [prompt: string];
  abort: [];
}>();

const draft = ref('');

function handleKey(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    submit();
  }
}

function submit(): void {
  const text = draft.value.trim();
  if (!text || props.busy || props.disabled) return;
  emit('send', text);
  draft.value = '';
}
</script>

<template>
  <div class="border-t border-border bg-background px-4 py-3">
    <div
      class="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-sm transition-shadow focus-within:ring-1 focus-within:ring-ring"
    >
      <textarea
        v-model="draft"
        :disabled="busy || disabled"
        :rows="2"
        placeholder="Describe what you want the agent to do in Photoshop…"
        class="block w-full resize-none border-0 bg-transparent px-4 pt-3 pb-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 max-h-48 min-h-[52px]"
        @keydown="handleKey"
      />
      <div class="flex items-center justify-between gap-2 px-2 pb-2">
        <div class="min-w-0 flex-1">
          <slot name="actions" />
        </div>
        <Button
          v-if="!busy"
          size="icon"
          :disabled="!draft.trim() || disabled"
          class="size-8 rounded-full disabled:opacity-40"
          @click="submit"
        >
          <ArrowUp class="size-4" />
        </Button>
        <Button
          v-else
          size="icon"
          variant="secondary"
          class="size-8 rounded-full"
          @click="emit('abort')"
        >
          <Square class="size-3.5" />
        </Button>
      </div>
    </div>
    <p class="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
      Press <kbd class="rounded border border-border px-1 py-px text-[10px]">Enter</kbd>
      to send · <kbd class="rounded border border-border px-1 py-px text-[10px]">Shift+Enter</kbd>
      for newline
    </p>
  </div>
</template>
