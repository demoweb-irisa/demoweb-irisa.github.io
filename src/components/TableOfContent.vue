<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  headings: Array<{ level: number; title: string; id: string }>;
}>();

const activeId = ref('');

function updateActiveHeading() {
  const headingElements = props.headings
    .map(h => document.getElementById(h.id))
    .filter(Boolean) as HTMLElement[];

  const scrollPosition = window.scrollY + 100;

  for (let i = headingElements.length - 1; i >= 0; i--) {
    const element = headingElements[i];
    if (element && element.offsetTop <= scrollPosition) {
      activeId.value = props.headings[i].id;
      break;
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', updateActiveHeading, { passive: true });
  updateActiveHeading();
});

onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveHeading);
});
</script>

<template>
  <nav class="space-y-1">
    <a
      v-for="heading in headings"
      :key="heading.id"
      :href="`#${heading.id}`"
      :class="[
        'block py-1.5 px-2 rounded-lg text-sm transition-all duration-200',
        heading.level === 3 ? 'ml-4' : '',
        activeId === heading.id
          ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 font-medium'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
      ]"
    >
      {{ heading.title }}
    </a>
  </nav>
</template>