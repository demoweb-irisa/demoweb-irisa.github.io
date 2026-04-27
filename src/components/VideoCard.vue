<script setup lang="ts">
import type { Video } from '../types/video';

const props = defineProps<{
  video: Video;
}>();

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<template>
  <a 
    :href="`/videos/${video.id}`"
    class="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
  >
    <!-- Thumbnail -->
    <div class="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
      <img
        v-if="video.data.thumbnail"
        :src="video.data.thumbnail"
        :alt="video.data.title"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600"
      >
        <svg class="w-16 h-16 text-white/80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      
      <span
        v-if="video.data.duration"
        class="absolute bottom-2 right-2 px-2 py-1 bg-black/75 text-white text-xs rounded-md"
      >
        {{ formatDuration(video.data.duration) }}
      </span>

      <div class="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/20 transition-colors flex items-center justify-center">
        <div class="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
          <svg class="w-7 h-7 text-violet-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Contenu -->
    <div class="p-5">
      <div class="flex items-center gap-2 mb-3">
        <span class="px-2.5 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full">
          {{ video.data.category }}
        </span>
        <span class="text-xs text-gray-400">
          {{ formatDate(video.data.date) }}
        </span>
      </div>

      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        {{ video.data.title }}
      </h3>

      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
        {{ video.data.description }}
      </p>

      <div class="flex flex-wrap gap-1">
        <span
          v-for="tag in video.data.tags.slice(0, 4)"
          :key="tag"
          class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md"
        >
          #{{ tag }}
        </span>
        <span
          v-if="video.data.tags.length > 4"
          class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-md"
        >
          +{{ video.data.tags.length - 4 }}
        </span>
      </div>
    </div>
  </a>
</template>