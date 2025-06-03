document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Audio elements
    const audio = new Audio();
    let currentTrack = null;
    let tracks = [];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let updateInterval;
    let lastPositionUpdate = 0;
    let isSeeking = false;
    let seekTimeout = null;
    let currentSpeed = 1.0;
    
    // DOM elements
    const trackArt = document.getElementById('track-art');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const endBtn = document.getElementById('end-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const volumeBar = document.getElementById('volume-bar');
    const searchResults = document.getElementById('search-results');
    const loadingIndicator = document.getElementById('loading');
    const speedDownBtn = document.getElementById('speed-down');
    const speedUpBtn = document.getElementById('speed-up');
    const speedDisplay = document.getElementById('speed-display');
    
    // Initialize player
    initPlayer();
    
    // Parse query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    
    if (query) {
        searchTracks(query);
    }
    
    function initPlayer() {
        // Event listeners
        playBtn.addEventListener('click', togglePlay);
        stopBtn.addEventListener('click', stop);
        prevBtn.addEventListener('click', playPrevious);
        nextBtn.addEventListener('click', playNext);
        endBtn.addEventListener('click', endSession);
        speedDownBtn.addEventListener('click', () => adjustSpeed(-0.25));
        speedUpBtn.addEventListener('click', () => adjustSpeed(0.25));
        progressBar.addEventListener('input', () => {
            isSeeking = true;
            const seekTime = (progressBar.value / 100) * audio.duration;
            currentTimeEl.textContent = formatTime(seekTime);
            // Clear any pending seek update
            if (seekTimeout) clearTimeout(seekTimeout);
            // Update after 500ms of no changes (debounce)
            seekTimeout = setTimeout(() => {
                audio.currentTime = seekTime;
                isSeeking = false;
                
                // Immediately update backend on seek completion
                if (tg.initDataUnsafe?.chat?.id) {
                    fetch(`/api/player/position?chatId=${tg.initDataUnsafe.chat.id}&position=${seekTime}`)
                    .catch(err => console.error('Seek update failed:', err));
                }
            }, 500);
        });
        progressBar.addEventListener('change', () => {
            // Immediate update when user releases slider
            if (seekTimeout) clearTimeout(seekTimeout);
            const seekTime = (progressBar.value / 100) * audio.duration;
            audio.currentTime = seekTime;
            isSeeking = false;
            
            if (tg.initDataUnsafe?.chat?.id) {
                fetch(`/api/player/position?chatId=${tg.initDataUnsafe.chat.id}&position=${seekTime}`)
                .catch(err => console.error('Seek update failed:', err));
            }
        });
        progressBar.addEventListener('mousedown', () => {
             isSeeking = true;
        });
        progressBar.addEventListener('mouseup', () => {
            isSeeking = false;
        });

        volumeBar.addEventListener('input', setVolume);
        
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', playNext);
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        });
        audio.addEventListener('play', () => {
            isPlaying = true;
            playBtn.textContent = '⏸';
            updatePlaybackState(true);
        });
        audio.addEventListener('pause', () => {
            isPlaying = false;
            playBtn.textContent = '▶';
            updatePlaybackState(false);
        });
        
        // Set initial volume
        audio.volume = volumeBar.value / 100;

        // Call this in your initPlayer():
        initVolume(tg.initDataUnsafe?.chat?.id);

        // Call this in your initPlayer():
        initSpeed(tg.initDataUnsafe?.chat?.id);
        
        // Check for existing player state
        if (tg.initDataUnsafe?.chat?.id) {
            fetchPlayerState(tg.initDataUnsafe.chat.id);
        }
    }

    async function adjustSpeed(change) {
        const newSpeed = Math.round((currentSpeed + change) * 100) / 100;
        if (newSpeed >= 0.5 && newSpeed <= 2.0) {
            currentSpeed = newSpeed;
            audio.playbackRate = currentSpeed;
            speedDisplay.textContent = `${currentSpeed.toFixed(1)}x`;
            
            if (tg.initDataUnsafe?.chat?.id) {
                await fetch(`/api/player/speed?chatId=${tg.initDataUnsafe.chat.id}&speed=${currentSpeed}`);
            }
        }
    }
    
    async function fetchPlayerState(chatId) {
        try {
            const response = await fetch(`/api/player/state?chatId=${chatId}`);
            if (response.ok) {
                const state = await response.json();
                if (state.currentTrack) {
                    // Restore player state
                    currentTrack = state.currentTrack;
                    tracks = state.queue;
                    currentTrackIndex = state.currentTrackIndex || 0;
                    
                    // Update UI
                    updateTrackInfo(currentTrack);
                    
                    if (state.isPlaying) {
                        await playCurrentTrack(state.position);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch player state:', error);
        }
    }
    
    async function searchTracks(query) {
        try {
            showLoading();
            
            const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
            if (!response.ok) {
                throw new Error('Search failed');
            }
            
            tracks = await response.json();
            displaySearchResults(tracks);
            
            if (tracks.length > 0) {
                currentTrackIndex = 0;
                await playTrack(tracks[0]);
            }
        } catch (error) {
            console.error('Search error:', error);
            showError('Failed to search for tracks');
        } finally {
            hideLoading();
        }
    }

    // Initialize volume from backend state
    async function initVolume(chatId) {
        try {
            const response = await fetch(`/api/player/state?chatId=${chatId}`);
            if (response.ok) {
                const state = await response.json();
                volumeBar.value = state.volume || 50;
                audio.volume = (state.volume || 50) / 100;
            }
        } catch (error) {
            console.error('Failed to init volume:', error);
        }
    }

    // Initialize speed from backend
    async function initSpeed(chatId) {
        try {
            const response = await fetch(`/api/player/state?chatId=${chatId}`);
            if (response.ok) {
                const state = await response.json();
                if (state.playbackSpeed) {
                    currentSpeed = state.playbackSpeed;
                    audio.playbackRate = currentSpeed;
                    speedDisplay.textContent = `${currentSpeed.toFixed(1)}x`;
                }
            }
        } catch (error) {
            console.error('Failed to init speed:', error);
        }
    }

    
    function displaySearchResults(results) {
        searchResults.innerHTML = '';
        
        if (results.length === 0) {
            searchResults.innerHTML = '<p class="no-results">No results found</p>';
            return;
        }
        
        results.forEach((track, index) => {
            const trackEl = document.createElement('div');
            trackEl.className = 'track-item';
            trackEl.innerHTML = `
                <img src="${track.thumbnail}" alt="${track.title}">
                <div class="track-details">
                    <h3>${track.title}</h3>
                    <p>${track.artist} • ${track.duration}</p>
                </div>
            `;
            
            trackEl.addEventListener('click', () => {
                currentTrackIndex = index;
                playTrack(track, index);
            });
            searchResults.appendChild(trackEl);
        });
    }
    
    async function playTrack(track, index = null) {
        try {
            showLoading();
            
            if (index !== null) {
                currentTrackIndex = index;
            }
            
            currentTrack = track;
            updateTrackInfo(track);
            
            // Get stream URL
            const response = await fetch(`/api/stream?id=${track.id}`);
            if (!response.ok) {
                throw new Error('Failed to get stream URL');
            }
            
            const { url } = await response.json();
            
            // Set audio source
            audio.src = url;
            audio.load();
            
            // Update player state on backend
            if (tg.initDataUnsafe?.chat?.id) {
                await fetch(`/api/player/play?chatId=${tg.initDataUnsafe.chat.id}&trackId=${track.id}`);
            }
            
            await audio.play();
        } catch (error) {
            console.error('Play error:', error);
            showError('Failed to play track');
        } finally {
            hideLoading();
        }
    }
    
    async function playCurrentTrack(position = 0) {
        if (!currentTrack) return;
        
        try {
            // Get stream URL
            const response = await fetch(`/api/stream?id=${currentTrack.id}`);
            if (!response.ok) {
                throw new Error('Failed to get stream URL');
            }
            
            const { url } = await response.json();
            
            // Set audio source
            audio.src = url;
            audio.load();
            
            // Set position if resuming
            if (position > 0) {
                audio.currentTime = position;
            }
            
            await audio.play();
        } catch (error) {
            console.error('Play error:', error);
            showError('Failed to play track');
        }
    }
    
    function togglePlay() {
        if (audio.paused) {
            audio.play();
            if (tg.initDataUnsafe?.chat?.id) {
                fetch(`/api/player/resume?chatId=${tg.initDataUnsafe.chat.id}`);
            }
        } else {
            audio.pause();
            if (tg.initDataUnsafe?.chat?.id) {
                fetch(`/api/player/pause?chatId=${tg.initDataUnsafe.chat.id}`);
            }
        }
    }
    
    function stop() {
        audio.pause();
        audio.currentTime = 0;
        if (tg.initDataUnsafe?.chat?.id) {
            fetch(`/api/player/stop?chatId=${tg.initDataUnsafe.chat.id}`);
        }
    }
    
    function playPrevious() {
        if (tracks.length === 0) return;
        
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        playTrack(tracks[currentTrackIndex]);
    }
    
    function playNext() {
        if (tracks.length === 0) return;
        
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        playTrack(tracks[currentTrackIndex]);
    }
    
    function endSession() {
        audio.pause();
        audio.src = '';
        
        if (tg.initDataUnsafe?.chat?.id) {
            fetch(`/api/player/end?chatId=${tg.initDataUnsafe.chat.id}`)
                .then(() => tg.close());
        } else {
            tg.close();
        }
    }
    
    function updateTrackInfo(track) {
        trackArt.src = track.thumbnail;
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
    }
    
    // Modify the updateProgress function to include position updates:
    function updateProgress() {
        const { currentTime, duration } = audio;
        // Only update progress bar if not currently seeking
        if (!isSeeking) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.value = progressPercent;
            currentTimeEl.textContent = formatTime(currentTime);
        }
        
        // Throttle position updates to backend (max once per second)
        const now = Date.now();
        if (tg.initDataUnsafe?.chat?.id && 
            !isSeeking && 
            now - lastPositionUpdate > 1000) {
                lastPositionUpdate = now;
                fetch(`/api/player/position?chatId=${tg.initDataUnsafe.chat.id}&position=${currentTime}`)
                .catch(err => console.error('Position update failed:', err));
            }
        }
    
    function seek() {
        const seekTime = (progressBar.value / 100) * audio.duration;
        audio.currentTime = seekTime;
        
        // Update backend immediately
        if (tg.initDataUnsafe?.chat?.id) {
            fetch(`/api/player/seek?chatId=${tg.initDataUnsafe.chat.id}&position=${seekTime}`);
        }
    }

    
    function setVolume() {
        const volume = volumeBar.value;
        audio.volume = volume / 100;
        // Persist volume to backend
        if (tg.initDataUnsafe?.chat?.id) {
            fetch(`/api/player/volume?chatId=${tg.initDataUnsafe.chat.id}&volume=${volume}`);
        }
    }
    
    function updatePlaybackState(playing) {
        if (tg.initDataUnsafe?.chat?.id) {
            fetch(`/api/player/${playing ? 'resume' : 'pause'}?chatId=${tg.initDataUnsafe.chat.id}`);
        }
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    function showLoading() {
        loadingIndicator.style.display = 'block';
    }
    
    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }
    
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 3000);
    }
});

