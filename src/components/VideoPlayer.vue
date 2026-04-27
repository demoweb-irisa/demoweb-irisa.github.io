<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  videoSrc: string;
  thumbnail?: string;
  title: string;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const isPlaying = ref(false);
const isFullscreen = ref(false);
const isPiP = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);
const isMuted = ref(false);
const playbackRate = ref(1);
const showControls = ref(true);
const buffered = ref(0);
const isLoaded = ref(false);
const isError = ref(false);

let hideControlsTimer: ReturnType<typeof setTimeout>;
let animationFrame: number;

const progress = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0;
});

const bufferedProgress = computed(() => {
  return duration.value > 0 ? (buffered.value / duration.value) * 100 : 0;
});

const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));
const formattedRemaining = computed(() => {
  const remaining = duration.value - currentTime.value;
  return remaining > 0 ? `-${formatTime(remaining)}` : '0:00';
});

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function togglePlay() {
  const video = videoRef.value;
  if (!video) return;

  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

function toggleMute() {
  const video = videoRef.value;
  if (!video) return;
  
  video.muted = !video.muted;
  isMuted.value = video.muted;
  if (!video.muted) {
    volume.value = video.volume;
  }
}

function handleVolumeChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const newVolume = parseFloat(input.value);
  volume.value = newVolume;
  
  const video = videoRef.value;
  if (!video) return;
  
  video.volume = newVolume;
  video.muted = newVolume === 0;
  isMuted.value = video.muted;
}

function seek(e: MouseEvent) {
  const video = videoRef.value;
  const progressBar = e.currentTarget as HTMLElement;
  if (!video || !progressBar) return;

  const rect = progressBar.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  video.currentTime = pos * video.duration;
}

function skip(seconds: number) {
  const video = videoRef.value;
  if (!video) return;
  video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || 0));
}

function cyclePlaybackRate() {
  const video = videoRef.value;
  if (!video) return;

  const currentIndex = playbackRates.indexOf(playbackRate.value);
  const nextIndex = (currentIndex + 1) % playbackRates.length;
  playbackRate.value = playbackRates[nextIndex];
  video.playbackRate = playbackRate.value;
}

async function toggleFullscreen() {
  const container = containerRef.value;
  if (!container) return;

  try {
    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
    }
  } catch (error) {
    console.error('Erreur fullscreen:', error);
  }
}

async function togglePiP() {
  const video = videoRef.value;
  if (!video) return;

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      isPiP.value = false;
    } else {
      await video.requestPictureInPicture();
      isPiP.value = true;
    }
  } catch (error) {
    console.error('Erreur PiP:', error);
  }
}

function showControlsTemporarily() {
  showControls.value = true;
  clearTimeout(hideControlsTimer);
  
  if (isPlaying.value) {
    hideControlsTimer = setTimeout(() => {
      showControls.value = false;
    }, 3000);
  }
}

function updateProgress() {
  const video = videoRef.value;
  if (!video) return;

  currentTime.value = video.currentTime;
  
  if (video.buffered.length > 0) {
    buffered.value = video.buffered.end(video.buffered.length - 1);
  }

  animationFrame = requestAnimationFrame(updateProgress);
}

// Événements
onMounted(() => {
  const video = videoRef.value;
  if (!video) return;

  video.addEventListener('play', () => {
    isPlaying.value = true;
    animationFrame = requestAnimationFrame(updateProgress);
  });

  video.addEventListener('pause', () => {
    isPlaying.value = false;
    cancelAnimationFrame(animationFrame);
  });

  video.addEventListener('ended', () => {
    isPlaying.value = false;
    cancelAnimationFrame(animationFrame);
  });

  video.addEventListener('loadedmetadata', () => {
    duration.value = video.duration;
    isLoaded.value = true;
  });

  video.addEventListener('error', () => {
    isError.value = true;
    isLoaded.value = false;
  });

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });

  document.addEventListener('keydown', handleKeyboard);
});

onUnmounted(() => {
  const video = videoRef.value;
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
  
  cancelAnimationFrame(animationFrame);
  clearTimeout(hideControlsTimer);
  document.removeEventListener('keydown', handleKeyboard);
});

function handleKeyboard(e: KeyboardEvent) {
  const video = videoRef.value;
  if (!video) return;

  switch(e.key) {
    case ' ':
    case 'k':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      skip(-5);
      break;
    case 'ArrowRight':
      e.preventDefault();
      skip(5);
      break;
    case 'ArrowUp':
      e.preventDefault();
      volume.value = Math.min(1, volume.value + 0.1);
      video.volume = volume.value;
      break;
    case 'ArrowDown':
      e.preventDefault();
      volume.value = Math.max(0, volume.value - 0.1);
      video.volume = volume.value;
      break;
    case 'm':
      e.preventDefault();
      toggleMute();
      break;
    case 'f':
      e.preventDefault();
      toggleFullscreen();
      break;
    case 'p':
      e.preventDefault();
      togglePiP();
      break;
  }
}

// Computed pour les raccourcis clavier
const keyboardShortcuts = [
  { key: 'Espace / K', description: 'Lecture/Pause' },
  { key: '← →', description: 'Reculer/Avancer 5s' },
  { key: '↑ ↓', description: 'Volume' },
  { key: 'M', description: 'Muet' },
  { key: 'F', description: 'Plein écran' },
  { key: 'P', description: 'Picture in Picture' },
];
</script>

<template>
  <div 
    ref="containerRef"
    class="relative group bg-black rounded-2xl overflow-hidden"
    @mousemove="showControlsTemporarily"
    @mouseleave="showControls = isPlaying ? false : true"
  >
    <!-- Vidéo -->
    <video
      ref="videoRef"
      :src="videoSrc"
      :poster="thumbnail"
      :title="title"
      class="w-full aspect-video cursor-pointer"
      playsinline
      preload="metadata"
      @click="togglePlay"
      @dblclick="toggleFullscreen"
    >
      Votre navigateur ne supporte pas la lecture vidéo.
    </video>

    <!-- Overlay Play/Pause central -->
    <div 
      v-if="!isPlaying && !isError"
      class="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
      @click="togglePlay"
    >
      <div class="w-20 h-20 bg-violet-600/90 rounded-full flex items-center justify-center transform hover:scale-110 transition-all duration-200 shadow-2xl">
        <svg class="w-10 h-10 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
    </div>

    <!-- Overlay erreur -->
    <div 
      v-if="isError"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 text-white gap-4"
    >
      <svg class="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <p class="text-lg font-semibold">Erreur de chargement</p>
      <p class="text-sm text-gray-400">Impossible de charger la vidéo</p>
      <button 
        @click="videoRef?.load()"
        class="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
      >
        Réessayer
      </button>
    </div>

    <!-- Contrôles -->
    <div 
      :class="[
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300',
        showControls ? 'opacity-100' : 'opacity-0'
      ]"
    >
      <!-- Barre de progression -->
      <div 
        class="relative w-full h-1 bg-gray-600/50 rounded-full mb-4 cursor-pointer group/progress hover:h-2 transition-all duration-200"
        @click="seek"
      >
        <!-- Buffer -->
        <div 
          class="absolute top-0 left-0 h-full bg-gray-500/50 rounded-full"
          :style="{ width: `${bufferedProgress}%` }"
        />
        <!-- Progression -->
        <div 
          class="absolute top-0 left-0 h-full bg-violet-500 rounded-full"
          :style="{ width: `${progress}%` }"
        />
        <!-- Thumb -->
        <div 
          class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-violet-400 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
          :style="{ left: `calc(${progress}% - 6px)` }"
        />
      </div>

      <!-- Boutons de contrôle -->
      <div class="flex items-center gap-3">
        <!-- Play/Pause -->
        <button 
          @click="togglePlay"
          class="text-white hover:text-violet-400 transition-colors p-1"
          :title="isPlaying ? 'Pause' : 'Lecture'"
        >
          <svg v-if="!isPlaying" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        </button>

        <!-- Skip back 10s -->
        <button 
          @click="skip(-10)"
          class="text-white hover:text-violet-400 transition-colors p-1 hidden sm:block"
          title="Reculer de 10 secondes"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
          </svg>
        </button>

        <!-- Skip forward 10s -->
        <button 
          @click="skip(10)"
          class="text-white hover:text-violet-400 transition-colors p-1 hidden sm:block"
          title="Avancer de 10 secondes"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z"/>
          </svg>
        </button>

        <!-- Volume -->
        <div class="flex items-center gap-1 group/volume">
          <button 
            @click="toggleMute"
            class="text-white hover:text-violet-400 transition-colors p-1"
            :title="isMuted ? 'Activer le son' : 'Couper le son'"
          >
            <svg v-if="isMuted || volume === 0" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
            <svg v-else-if="volume < 0.5" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            :value="isMuted ? 0 : volume"
            @input="handleVolumeChange"
            class="w-0 group-hover/volume:w-20 transition-all duration-200 accent-violet-500 cursor-pointer hidden sm:block"
            title="Volume"
          />
        </div>

        <!-- Timer -->
        <span class="text-white text-sm tabular-nums">
          {{ formattedCurrentTime }} / {{ formattedDuration }}
        </span>

        <div class="flex-1" />

        <!-- Vitesse de lecture -->
        <button 
          @click="cyclePlaybackRate"
          class="text-white hover:text-violet-400 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-white/10 min-w-[3rem]"
          title="Vitesse de lecture"
        >
          {{ playbackRate }}x
        </button>

        <!-- Picture in Picture -->
        <button 
          @click="togglePiP"
          class="text-white hover:text-violet-400 transition-colors p-1 hidden sm:block"
          title="Picture in Picture"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/>
          </svg>
        </button>

        <!-- Plein écran -->
        <button 
          @click="toggleFullscreen"
          class="text-white hover:text-violet-400 transition-colors p-1"
          :title="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'"
        >
          <svg v-if="!isFullscreen" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Raccourcis clavier tooltip -->
    <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:block">
      <div class="bg-black/80 backdrop-blur-sm text-white text-xs rounded-lg p-3 space-y-1">
        <p class="font-semibold mb-2">⌨️ Raccourcis</p>
        <div v-for="shortcut in keyboardShortcuts" :key="shortcut.key" class="flex justify-between gap-4">
          <span class="text-violet-300">{{ shortcut.key }}</span>
          <span class="text-gray-400">{{ shortcut.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>