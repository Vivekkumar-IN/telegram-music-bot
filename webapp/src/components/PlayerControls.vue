<template>
  <div class="player-dashboard">
    <audio-visualizer :audio-element="player" />
    <div class="controls">
      <button @click="togglePlayPause">{{ isPlaying ? '⏸' : '▶' }}</button>
      <input type="range" v-model="volume" min="0" max="1" step="0.1" />
      <div class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    player: HTMLAudioElement
  },
  data() {
    return {
      isPlaying: false,
      volume: 1,
      currentTime: 0,
      duration: 0
    }
  },
  methods: {
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    togglePlayPause() {
      this.player[this.isPlaying ? 'pause' : 'play']()
      this.isPlaying = !this.isPlaying
    }
  }
}
</script>

<style scoped>
.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #2c3e50;
  border-radius: 8px;
}
</style>