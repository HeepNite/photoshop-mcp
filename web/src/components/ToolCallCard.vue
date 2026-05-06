<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import type { ToolCall } from '@/stores/chat';

const props = defineProps<{ toolCall: ToolCall }>();

const open = ref(false);

const displayName = computed(() => {
  const name = props.toolCall.name;
  return name.startsWith('mcp__photoshop__') ? name.slice('mcp__photoshop__'.length) : name;
});

const formattedInput = computed(() => safeJson(props.toolCall.input));
const formattedResult = computed(() => props.toolCall.result?.content ?? '');

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card/50">
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
      @click="open = !open"
    >
      <component :is="open ? ChevronDown : ChevronRight" class="size-3 text-muted-foreground" />
      <span class="font-mono text-foreground">{{ displayName }}</span>
      <span class="ml-auto flex items-center gap-1.5">
        <Loader2 v-if="toolCall.status === 'pending'" class="size-3 animate-spin text-muted-foreground" />
        <CheckCircle2 v-else-if="toolCall.status === 'success'" class="size-3.5 text-emerald-500" />
        <XCircle v-else class="size-3.5 text-destructive" />
        <Badge v-if="toolCall.status !== 'pending'" :variant="toolCall.status === 'success' ? 'success' : 'destructive'" class="text-[10px]">
          {{ toolCall.status }}
        </Badge>
      </span>
    </button>
    <div v-if="open" class="space-y-2 border-t border-border p-3 text-xs">
      <div>
        <div class="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Input
        </div>
        <pre class="overflow-x-auto rounded-md bg-muted/40 p-2 text-[11px] leading-snug">{{ formattedInput }}</pre>
      </div>
      <div v-if="toolCall.result">
        <div class="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Result
        </div>
        <pre class="max-h-64 overflow-auto rounded-md bg-muted/40 p-2 text-[11px] leading-snug">{{ formattedResult }}</pre>
      </div>
    </div>
  </div>
</template>
