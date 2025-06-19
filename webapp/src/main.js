import { createApp } from 'vue'
import App from './App.vue'
import PlayerControls from './components/PlayerControls.vue'

const app = createApp(App)
app.component('PlayerControls', PlayerControls)
app.mount('#app')