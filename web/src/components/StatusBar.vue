<script setup lang="ts">
import type { ChatSummary } from '@/lib/api';

defineProps<{
  chat: ChatSummary | null;
}>();
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur"
  >
    <div class="min-w-0 flex-1 truncate text-sm font-medium">
      {{ chat?.title ?? 'New chat' }}
    </div>
  </header>
</template>
