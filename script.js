document.addEventListener('DOMContentLoaded', () => {
    // --- Elements ---
    const loaderContainer = document.getElementById('loader-container');
    const promptContainer = document.getElementById('prompt-container');
    const continueBtn = document.getElementById('continue-btn');
    
    const videoContainer = document.getElementById('video-container');
    const mainVideo = document.getElementById('main-video');
    const videoWrapper = document.querySelector('.video-wrapper');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const playOverlay = document.getElementById('play-overlay');
    const pauseOverlay = document.getElementById('pause-overlay');

    // --- State ---
    let isPlaying = true; 
    let hasTransitioned = false;

    // --- 1. Flow Transitions ---
    function transitionToPrompt() {
        if (hasTransitioned) return;
        hasTransitioned = true;
        
        // Fade out loader
        loaderContainer.classList.add('hidden');
        
        // Fade in prompt
        promptContainer.classList.remove('hidden');
        
        // Fade in arrow button shortly after
        setTimeout(() => {
            continueBtn.classList.remove('hidden');
        }, 1200);
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

    // --- 2. Main Video Controls ---
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

    // --- 3. Instant Native Loading ---
    
    // Wait for the video to buffer enough to play
    if (mainVideo.readyState >= 3) { // HAVE_FUTURE_DATA
        setTimeout(transitionToPrompt, 800);
    } else {
        mainVideo.addEventListener('canplay', () => {
            setTimeout(transitionToPrompt, 800);
        });
        
        // Fallback: if 'canplay' takes too long or fails to fire on some mobile browsers
        setTimeout(transitionToPrompt, 3500); 
    }
});
