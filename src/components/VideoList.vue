<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Video, VideoFilters } from '../types/video';

const props = defineProps<{
  videos: Video[];
}>();

const filters = ref<VideoFilters>({
  sortBy: 'date',
  sortOrder: 'desc',
});

const allTags = computed(() => {
  const tags = new Set(props.videos.flatMap(v => v.data.tags));
  return Array.from(tags).sort();
});

const allCategories = computed(() => {
  const categories = new Set(props.videos.map(v => v.data.category));
  return Array.from(categories);
});

const filteredVideos = computed(() => {
  let result = [...props.videos];

  if (filters.value.category) {
    result = result.filter(video => video.data.category === filters.value.category);
  }

  if (filters.value.tags?.length) {
    result = result.filter(video =>
      filters.value.tags!.some(tag => video.data.tags.includes(tag))
    );
  }

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase();
    result = result.filter(
      video =>
        video.data.title.toLowerCase().includes(search) ||
        video.data.description.toLowerCase().includes(search)
    );
  }

  result.sort((a, b) => {
    const order = filters.value.sortOrder === 'asc' ? 1 : -1;
    switch (filters.value.sortBy) {
      case 'title':
        return order * a.data.title.localeCompare(b.data.title);
      case 'duration':
        return order * ((a.data.duration || 0) - (b.data.duration || 0));
      case 'date':
      default:
        return order * (new Date(a.data.date).getTime() - new Date(b.data.date).getTime());
    }
  });

  return result;
});

const toggleTag = (tag: string) => {
  if (!filters.value.tags) {
    filters.value.tags = [];
  }
  const index = filters.value.tags.indexOf(tag as any);
  if (index > -1) {
    filters.value.tags.splice(index, 1);
  } else {
    filters.value.tags.push(tag as any);
  }
};

const clearFilters = () => {
  filters.value = {
    sortBy: 'date',
    sortOrder: 'desc',
  };
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
</script>

<template>
  <div class="space-y-8">
    <!-- Barre de filtres -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
      <!-- Recherche et tris -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="filters.search"
            type="search"
            placeholder="Rechercher une vidéo..."
            class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>
        
        <select 
          v-model="filters.category"
          class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
        >
          <option value="">📂 Toutes les catégories</option>
          <option v-for="cat in allCategories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>

        <select 
          v-model="filters.sortBy"
          class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all cursor-pointer"
        >
          <option value="date">📅 Trier par date</option>
          <option value="title">🔤 Trier par titre</option>
          <option value="duration">⏱️ Trier par durée</option>
        </select>
      </div>

      <!-- Tags filter -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in allTags"
          :key="tag"
          @click="toggleTag(tag)"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
            filters.tags?.includes(tag as any)
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25 scale-105'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          ]"
        >
          #{{ tag }}
        </button>
      </div>

      <!-- Filtres actifs -->
      <div v-if="filters.search || filters.category || filters.tags?.length" class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-2">
          <span v-if="filters.search" class="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-sm">
            🔍 "{{ filters.search }}"
          </span>
          <span v-if="filters.category" class="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-sm">
            📂 {{ filters.category }}
          </span>
          <span v-for="tag in filters.tags" :key="tag" class="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-sm">
            #{{ tag }}
          </span>
        </div>
        <button 
          @click="clearFilters"
          class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
        >
          Effacer les filtres
        </button>
      </div>
    </div>

    <!-- Résultats -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        <span class="font-semibold text-gray-900 dark:text-white">{{ filteredVideos.length }}</span> 
        vidéo{{ filteredVideos.length > 1 ? 's' : '' }} trouvée{{ filteredVideos.length > 1 ? 's' : '' }}
      </p>
    </div>

    <!-- Grille de vidéos -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="video in filteredVideos"
        :key="video.id"
        class="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
      >
        <!-- Thumbnail -->
        <a :href="`/videos/${video.id}`" class="block relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
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
            <svg class="w-16 h-16 text-white/80 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          
          <!-- Badge durée -->
          <span
            v-if="video.data.duration"
            class="absolute bottom-2 right-2 px-2 py-1 bg-black/75 backdrop-blur-sm text-white text-xs font-medium rounded-lg"
          >
            ⏱ {{ formatDuration(video.data.duration) }}
          </span>

          <!-- Overlay au survol -->
          <div class="absolute inset-0 bg-violet-600/0 group-hover:bg-violet-600/20 transition-colors duration-300 flex items-center justify-center">
            <div class="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-2xl">
              <svg class="w-8 h-8 text-violet-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </a>

        <!-- Contenu -->
        <div class="p-5">
          <!-- Catégorie -->
          <div class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 text-xs font-medium bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-full">
              {{ video.data.category }}
            </span>
            <span class="text-xs text-gray-400 dark:text-gray-500">
              {{ formatDate(video.data.date) }}
            </span>
          </div>

          <!-- Titre -->
          <a :href="`/videos/${video.id}`" class="block group/title">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover/title:text-violet-600 dark:group-hover/title:text-violet-400 transition-colors">
              {{ video.data.title }}
            </h3>
          </a>

          <!-- Description -->
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
            {{ video.data.description }}
          </p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1">
            <span
              v-for="tag in video.data.tags.slice(0, 4)"
              :key="tag"
              class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer"
              @click="toggleTag(tag)"
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
      </article>
    </div>

    <!-- Message si pas de résultats -->
    <div v-if="filteredVideos.length === 0 && props.videos.length > 0" class="text-center py-16">
      <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Aucune vidéo trouvée
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Essayez de modifier vos critères de recherche
      </p>
      <button
        @click="clearFilters"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
      >
        Réinitialiser les filtres
      </button>
    </div>
  </div>
</template>