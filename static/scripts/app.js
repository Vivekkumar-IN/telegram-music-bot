document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram Web App
    const tg = window.Telegram.WebApp;

  if (!tg || !tg.initDataUnsafe) {

    return 
  }
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Audio elements
    const audio = new Audio();
    let currentTrack = null;
    let tracks = [];
    let currentTrackIndex = 0;
    // let isPlaying = false;
    // let updateInterval; // Removed unused variable
    let lastPositionUpdate = 0;
    let isSeeking = false;
    let seekTimeout = null;
    let currentSpeed = 1.0;
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let animationFrameId = null;
    let lyricsData = null;
    let currentLyricIndex = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    

    
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
    // const loadingIndicator = document.getElementById('loading');
    const speedDownBtn = document.getElementById('speed-down');
    const speedUpBtn = document.getElementById('speed-up');
    const speedDisplay = document.getElementById('speed-display');
    const gestureArea = document.getElementById('gesture-area');
    const gestureFeedback = document.createElement('div');
    gestureFeedback.className = 'gesture-feedback';
    gestureArea.appendChild(gestureFeedback);
    
    
    // Initialize player
    initPlayer();
    

    const query  = tg.initDataUnsafe.start_param;
    
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
        audio.addEventListener('play', () => {
            if (!audioContext) initVisualizer();
        });
        audio.addEventListener('pause', stopVisualizer);
        audio.addEventListener('ended', stopVisualizer);
        gestureArea.addEventListener('touchstart', handleTouchStart);
        gestureArea.addEventListener('touchmove', handleTouchMove);
        gestureArea.addEventListener('touchend', handleTouchEnd);
        gestureArea.addEventListener('dblclick', handleDoubleTap);
        gestureArea.addEventListener('dblclick', handleDoubleTap);
        
        // Set initial volume
        audio.volume = volumeBar.value / 100;

        // Call this in your initPlayer():
        initVolume(tg.initDataUnsafe?.chat?.id);

        // Call this in your initPlayer():
        initSpeed(tg.initDataUnsafe?.chat?.id);

        initVisualizer();
        
        // Check for existing player state
        if (tg.initDataUnsafe?.chat?.id) {
            fetchPlayerState(tg.initDataUnsafe.chat.id);
        }
    }

    document.getElementById('toggle-lyrics').addEventListener('click', function() {
        const lyricsContent = document.getElementById('lyrics-content');
        lyricsContent.classList.toggle('hidden');
        this.textContent = lyricsContent.classList.contains('hidden') ? 'Show' : 'Hide';
    });

    async function fetchLyrics(track) {
        const lyricsContent = document.getElementById('lyrics-content');
        lyricsContent.innerHTML = '<p class="loading">Loading lyrics...</p>';
        try {
            const response = await fetch(`/api/lyrics?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
            if (!response.ok) throw new Error('Lyrics not found');
            
            lyricsData = await response.json();
            renderLyrics();
        } catch (error) {
            lyricsContent.innerHTML = `<p class="error">${error.message}</p>`;
            lyricsData = null;
        }
    }

    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
    }

    function handleTouchEnd(e) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const timeElapsed = Date.now() - touchStartTime;
        
        // Swipe detection (min distance: 50px, max time: 500ms)
        if (Math.abs(deltaX) > 50 && timeElapsed < 500) {
            if (deltaX > 0) {
                // Swipe right - rewind 10 seconds
                showGestureFeedback('⏪');
                audio.currentTime = Math.max(0, audio.currentTime - 10);
            } else {
                // Swipe left - forward 10 seconds
                showGestureFeedback('⏩');
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
            }
            return;
        }
        
        // Volume swipe (vertical, min distance: 30px)
        if (Math.abs(deltaY) > 30 && timeElapsed < 500) {
            if (deltaY > 0) {
                // Swipe down - volume down
                showGestureFeedback('🔉');
                volumeBar.value = Math.max(0, volumeBar.value - 10);
            } else {
                // Swipe up - volume up
                showGestureFeedback('🔊');
                volumeBar.value = Math.min(100, volumeBar.value + 10);
            }
            setVolume();
            return;
        }
        
        // Tap detection (short press)
        if (timeElapsed < 300) {
            togglePlay();
        }
    }

    function handleDoubleTap() {
        showGestureFeedback(audio.paused ? '▶' : '⏸');
        togglePlay();
    }
    
    function showGestureFeedback(icon) {
        gestureFeedback.textContent = icon;
        gestureFeedback.classList.add('show');
        setTimeout(() => {
            gestureFeedback.classList.remove('show');
        }, 1000);
    }
    
    function renderLyrics() {
        if (!lyricsData) return;
        const lyricsContent = document.getElementById('lyrics-content');
        lyricsContent.innerHTML = '';
        
        lyricsData.forEach((line) => {
            const p = document.createElement('p');
            p.textContent = line.text;
            p.dataset.time = line.time;
            lyricsContent.appendChild(p);
        });
    }

    function updateLyricsPosition() {
        if (!lyricsData) return;
        
        const lyricsLines = document.querySelectorAll('#lyrics-content p');
        const currentTime = audio.currentTime;
        
        // Find the current lyric
        let newIndex = 0;
        for (let i = 0; i < lyricsData.length; i++) {
            if (lyricsData[i].time <= currentTime) {
                newIndex = i;
            } else {
                break;
            }
        }
        if (newIndex !== currentLyricIndex) {
            if (lyricsLines[currentLyricIndex]) {
                lyricsLines[currentLyricIndex].classList.remove('active');
            }
            currentLyricIndex = newIndex;
            if (lyricsLines[currentLyricIndex]) {
                lyricsLines[currentLyricIndex].classList.add('active');
                
                // Auto-scroll to active lyric
                lyricsLines[currentLyricIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }



    function initVisualizer() {
        try {
            const AudioCtx = window.AudioContext ? window.AudioContext : (window.webkitAudioContext ? window.webkitAudioContext : null);
            if (!AudioCtx) throw new Error('Web Audio API not supported');
            audioContext = new AudioCtx();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            dataArray = new Uint8Array(analyser.frequencyBinCount);
             // Connect audio element to analyzer
             const source = audioContext.createMediaElementSource(audio);
             source.connect(analyser);
             analyser.connect(audioContext.destination);
             
             // Start visualization
            visualize();
        } catch (error) {
            console.error('AudioContext error:', error);
        }
    }

    function visualize() {
        if (!analyser) return;
        
        const canvas = document.getElementById('visualizer-canvas');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, width, height);
        
        // Draw bars
        const barWidth = (width / dataArray.length) * 2.5;
        
        let x = 0;
        
        for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * height;
            ctx.fillStyle = `hsl(${200 + (i * 2)}, 100%, 60%)`;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        animationFrameId = requestAnimationFrame(visualize);
    }
    
    function stopVisualizer() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
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
        fetchLyrics(track);
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
            updateLyricsPosition();
        }
    

    function setVolume() {
        // Ensure volumeBar is defined in this scope
        const volumeBarEl = document.getElementById('volume-bar');
        const volume = volumeBarEl.value;
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
        const loadingIndicatorEl = document.getElementById('loading');
        if (loadingIndicatorEl) loadingIndicatorEl.style.display = 'block';
    }

    function hideLoading() {
        const loadingIndicatorEl = document.getElementById('loading');
        if (loadingIndicatorEl) loadingIndicatorEl.style.display = 'none';
    }

    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        document.body.appendChild(errorEl);
        setTimeout(() => errorEl.remove(), 3000);
    }
});


