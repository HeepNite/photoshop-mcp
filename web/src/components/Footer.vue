<script setup lang="ts">
const repoUrl = 'https://github.com/alisaitteke/photoshop-mcp';
const authorUrl = 'https://github.com/alisaitteke';
</script>

<template>
  <footer
    class="flex h-9 shrink-0 items-center justify-center gap-2 border-t border-border/60 bg-background/80 px-4 text-[11px] text-muted-foreground backdrop-blur"
  >
    <a
      :href="repoUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="transition-colors hover:text-foreground"
    >
      GitHub
    </a>
    <span aria-hidden="true" class="text-muted-foreground/60">·</span>
    <span>
      by
      <a
        :href="authorUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="transition-colors hover:text-foreground"
      >
        @alisaitteke
      </a>
    </span>
  </footer>
</template>
