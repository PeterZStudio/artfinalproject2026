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
    let isPlaying = true; 

    // --- 1. Loader Animation Logic ---
    function startLoaderAnimation() {
        // Ensure canvas has a default size for the fallback text
        loaderCanvas.width = 300;
        loaderCanvas.height = 300;

        loaderVideo.play().catch(e => console.warn("Auto-play prevented or video not supported", e));
        isLoaderPlaying = true;
        renderLoader();
    }

    function renderLoader() {
        if (!loaderVideo.videoWidth) {
            // Fallback: If the browser doesn't support .mov, draw a clean text progress
            ctx.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height);
            ctx.fillStyle = '#4A3B32';
            ctx.font = 'italic 24px "Playfair Display", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const percentage = Math.min(Math.round(window.currentLoadProgress * 100), 100);
            ctx.fillText(`Loading... ${percentage}%`, loaderCanvas.width / 2, loaderCanvas.height / 2);
            
            animationFrameId = requestAnimationFrame(renderLoader);
            return;
        }

        // Once video is ready, match canvas size to video size
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
        const videoUrl = mainVideo.getAttribute('src');
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', videoUrl, true);
        xhr.responseType = 'blob';
        
        xhr.onprogress = (event) => {
            if (event.lengthComputable) {
                window.currentLoadProgress = event.loaded / event.total;
            } else {
                window.currentLoadProgress = Math.min(window.currentLoadProgress + 0.05, 0.99);
            }
        };
        
        xhr.onload = () => {
            // Accept 200 (OK) or 206 (Partial Content)
            if (xhr.status >= 200 && xhr.status < 300) {
                window.currentLoadProgress = 1;
                const blob = xhr.response;
                const objectUrl = URL.createObjectURL(blob);
                mainVideo.src = objectUrl;
            } else {
                console.error("Error loading video, status: " + xhr.status);
                window.currentLoadProgress = 1;
            }
            setTimeout(transitionToPrompt, 500); 
        };

        xhr.onerror = () => {
            console.error("XHR Network Error");
            window.currentLoadProgress = 1; 
            setTimeout(transitionToPrompt, 500);
        };

        xhr.send();
    }

    // --- 3. Flow Transitions ---
    function transitionToPrompt() {
        cancelAnimationFrame(animationFrameId);
        loaderVideo.pause();
        
        loaderContainer.classList.add('hidden');
        promptContainer.classList.remove('hidden');
        
        setTimeout(() => {
            continueBtn.classList.remove('hidden');
        }, 1500);
    }

    continueBtn.addEventListener('click', () => {
        promptContainer.classList.add('hidden');
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
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 800);
    }

    videoWrapper.addEventListener('click', (e) => {
        if(e.target.closest('#fullscreen-btn')) return;
        togglePlayPause();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !videoContainer.classList.contains('hidden')) {
            e.preventDefault();
            togglePlayPause();
        }
    });

    fullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) { 
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { 
                document.documentElement.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { 
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { 
                document.msExitFullscreen();
            }
        }
    });

    // Start everything
    startLoaderAnimation();
    preloadMainVideo();
});
