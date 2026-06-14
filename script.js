document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loaderContainer = document.getElementById('loader-container');
    const loaderVideo = document.getElementById('loader-video');
    const loaderCanvas = document.getElementById('loader-canvas');
    const ctx = loaderCanvas.getContext('2d');
    
    const promptContainer = document.getElementById('prompt-container');
    const continueBtn = document.getElementById('continue-btn');
    
    const videoContainer = document.getElementById('video-container');
    const mainVideo = document.getElementById('main-video');
    const videoWrapper = document.querySelector('.video-wrapper');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const playOverlay = document.getElementById('play-overlay');
    const pauseOverlay = document.getElementById('pause-overlay');

    // --- State ---
    window.currentLoadProgress = 0;
    let isLoaderPlaying = false;
    let animationFrameId = null;
    let isPlaying = true; // Main video will start playing automatically after clicking continue

    // --- 1. Loader Animation Logic ---
    function startLoaderAnimation() {
        if (!isLoaderPlaying) {
            loaderVideo.play().catch(e => console.warn("Auto-play prevented for loader video", e));
            isLoaderPlaying = true;
            renderLoader();
        }
    }

    function renderLoader() {
        if (!loaderVideo.videoWidth) {
            animationFrameId = requestAnimationFrame(renderLoader);
            return;
        }

        if (loaderCanvas.width !== loaderVideo.videoWidth) {
            loaderCanvas.width = loaderVideo.videoWidth;
            loaderCanvas.height = loaderVideo.videoHeight;
        }

        ctx.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height);
        
        // Draw the loader video (the mask)
        ctx.drawImage(loaderVideo, 0, 0, loaderCanvas.width, loaderCanvas.height);
        
        // Apply the fill color only where the video is opaque
        ctx.globalCompositeOperation = 'source-in';
        
        // Calculate fill height based on progress (0 to 1)
        const fillHeight = loaderCanvas.height * window.currentLoadProgress;
        const fillY = loaderCanvas.height - fillHeight;
        
        ctx.fillStyle = '#4A3B32';
        ctx.fillRect(0, fillY, loaderCanvas.width, fillHeight);
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
        
        animationFrameId = requestAnimationFrame(renderLoader);
    }

    // --- 2. Asset Preloading ---
    function preloadMainVideo() {
        // Original source: "FINAL EDITED FINAL PIECE FUNKY MONKEY ARTY PARTY.mp4"
        const videoUrl = mainVideo.src;
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', videoUrl, true);
        xhr.responseType = 'blob';
        
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                window.currentLoadProgress = event.loaded / event.total;
            } else {
                // Fallback fake progress if no content length
                window.currentLoadProgress = Math.min(window.currentLoadProgress + 0.05, 0.99);
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                window.currentLoadProgress = 1;
                const blob = xhr.response;
                const objectUrl = URL.createObjectURL(blob);
                mainVideo.src = objectUrl;
                
                // Finish loader animation and transition
                setTimeout(transitionToPrompt, 500); 
            }
        };

        xhr.onerror = () => {
            console.error("Error loading video");
            window.currentLoadProgress = 1; // force transition
            setTimeout(transitionToPrompt, 500);
        };

        xhr.send();
    }

    // --- 3. Flow Transitions ---
    function transitionToPrompt() {
        cancelAnimationFrame(animationFrameId);
        loaderVideo.pause();
        
        // Fade out loader
        loaderContainer.classList.add('hidden');
        
        // Fade in prompt
        promptContainer.classList.remove('hidden');
        
        // Fade in arrow button shortly after
        setTimeout(() => {
            continueBtn.classList.remove('hidden');
        }, 1500);
    }

    continueBtn.addEventListener('click', () => {
        // Fade out prompt
        promptContainer.classList.add('hidden');
        
        // Fade in main video
        videoContainer.classList.remove('hidden');
        
        mainVideo.play().then(() => {
            isPlaying = true;
        }).catch(e => console.error("Playback failed", e));
    });

    // --- 4. Main Video Controls ---
    function togglePlayPause() {
        if (mainVideo.paused) {
            mainVideo.play();
            isPlaying = true;
            showOverlay(playOverlay);
        } else {
            mainVideo.pause();
            isPlaying = false;
            showOverlay(pauseOverlay);
        }
    }

    function showOverlay(overlay) {
        overlay.classList.remove('hidden');
        // Hide again after a short delay
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 800);
    }

    videoWrapper.addEventListener('click', (e) => {
        // Prevent toggle if clicking fullscreen btn
        if(e.target.closest('#fullscreen-btn')) return;
        togglePlayPause();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !videoContainer.classList.contains('hidden')) {
            e.preventDefault(); // prevent page scroll
            togglePlayPause();
        }
    });

    // Fullscreen API
    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent play/pause toggle
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
                document.documentElement.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    });

    // Start everything
    startLoaderAnimation();
    preloadMainVideo();
});
