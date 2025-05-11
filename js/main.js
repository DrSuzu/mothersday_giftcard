document.addEventListener('DOMContentLoaded', function() {
    // Page transition functionality
    const pageTransition = document.querySelector('.page-transition');
    const envelope = document.querySelector('.envelope');
    const pageContainer = document.querySelector('.page-container');
    
    // Function to preload a page
    async function preloadPage(url) {
        const response = await fetch(url);
        const text = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(text, 'text/html');
    }

    // Function to handle page transitions
    async function handlePageTransition(url, isEnvelope = false) {
        try {
            // Start loading the next page
            const nextPage = await preloadPage(url);
            
            if (isEnvelope) {
                // Clone the envelope for the transition
                const envelopeClone = envelope.cloneNode(true);
                pageTransition.innerHTML = '';
                pageTransition.appendChild(envelopeClone);
            }
            
            // Show the transition
            pageTransition.classList.add('active');
            
            // Hide the current page after a short delay
            setTimeout(() => {
                if (pageContainer) {
                    pageContainer.classList.add('hidden');
                }
            }, 100);

            // Wait for transition animation
            await new Promise(resolve => setTimeout(resolve, 600));

            // Update the page content
            document.title = nextPage.title;
            document.body.innerHTML = nextPage.body.innerHTML;

            // Reinitialize the page
            initializePage();
        } catch (error) {
            console.error('Transition failed:', error);
            // Fallback to traditional navigation
            window.location.href = url;
        }
    }

    // Function to initialize page elements
    function initializePage() {
        // Reattach event listeners
        const envelope = document.querySelector('.envelope');
        if (envelope) {
            envelope.addEventListener('click', function() {
                handlePageTransition('content.html', true);
            });
        }

        // Initialize other elements
        initializeMusicPlayer();
        initializeGallery();
        initializeShareButton();
        initializeCloseButton();
    }

    // Initialize music player
    function initializeMusicPlayer() {
        const playButton = document.getElementById('play-music');
        const audio = document.getElementById('background-music');
        if (playButton && audio) {
            // Try to autoplay when the page loads
            audio.play().then(() => {
                playButton.classList.add('playing');
                playButton.innerHTML = '<i class="fas fa-pause"></i>';
            }).catch(() => {
                // Autoplay was prevented, show play button
                playButton.innerHTML = '<i class="fas fa-music"></i>';
            });

            playButton.addEventListener('click', function() {
                if (audio.paused) {
                    audio.play();
                    playButton.classList.add('playing');
                    playButton.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    audio.pause();
                    playButton.classList.remove('playing');
                    playButton.innerHTML = '<i class="fas fa-music"></i>';
                }
            });
        }
    }

    // Initialize gallery
    function initializeGallery() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        const lightbox = document.querySelector('.custom-lightbox');
        const lightboxImage = document.querySelector('.lightbox-image');
        const closeButton = document.querySelector('.lightbox-close');
        const prevButton = document.querySelector('.lightbox-prev');
        const nextButton = document.querySelector('.lightbox-next');
        let currentIndex = 0;
        let isTransitioning = false;

        // Create array of image sources
        const imageSources = Array.from(galleryItems).map(item => item.querySelector('img').src);

        // Function to get image URL with cache busting
        function getImageUrl(imgSrc) {
            return `${imgSrc}?t=${new Date().getTime()}`;
        }

        // Function to handle image transition
        function transitionImage(newIndex, direction) {
            if (isTransitioning) return;
            isTransitioning = true;
            console.log(`Transitioning: ${direction}, newIndex: ${newIndex}`);

            // Determine slide classes based on direction
            const slideOutClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
            const slideInClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';
            console.log(`Applying classes - slideOut: ${slideOutClass}, slideIn: ${slideInClass}`);

            // Current image slides out
            console.log('Before slide out:', lightboxImage.className);
            lightboxImage.classList.remove('active');
            // Remove ALL potential slide-in/out classes before adding the new slideOutClass
            lightboxImage.classList.remove('slide-in-left', 'slide-in-right', 'slide-out-left', 'slide-out-right');
            lightboxImage.classList.add(slideOutClass);
            console.log('After slide out:', lightboxImage.className);

            setTimeout(() => {
                console.log('Inside setTimeout for slide in');
                // Reset classes before setting new image and defining onload
                lightboxImage.classList.remove(slideOutClass, 'slide-in-left', 'slide-in-right', 'active');
                console.log('After removing all potentially conflicting classes:', lightboxImage.className);
                
                lightboxImage.src = getImageUrl(imageSources[newIndex]);
                
                lightboxImage.onload = () => {
                    console.log(`${direction} image loaded:`, imageSources[newIndex]);
                    
                    // Temporarily disable transitions to set initial position
                    lightboxImage.style.transition = 'none';
                    console.log('Before slide in (after onload, transition disabled):', lightboxImage.className);
                    lightboxImage.classList.add(slideInClass);
                    console.log('After slide in (transition disabled):', lightboxImage.className);
                    
                    // Force a reflow to apply the transform without transition
                    lightboxImage.offsetHeight;
                    
                    // Re-enable transitions for the slide-in animation
                    // Setting to empty string will make it pick up the CSS defined transition again
                    lightboxImage.style.transition = ''; 
                    console.log('Transitions re-enabled');
                    
                    // Trigger the slide-in animation in the next frame
                    requestAnimationFrame(() => {
                        console.log('Before adding active for slide in:', lightboxImage.className);
                        lightboxImage.classList.add('active');
                        console.log('After adding active for slide in:', lightboxImage.className);
                        setTimeout(() => {
                            isTransitioning = false;
                            console.log('Transition complete');
                        }, 250); // Match CSS transition duration
                    });
                };
            }, 250); // Match CSS transition duration
        }

        if (galleryItems.length && lightbox && lightboxImage) {
            // Open lightbox
            galleryItems.forEach((item, index) => {
                item.addEventListener('click', () => {
                    currentIndex = index;
                    const imgSrc = imageSources[index];
                    console.log('Opening image:', imgSrc);
                    lightboxImage.src = getImageUrl(imgSrc);
                    lightbox.classList.add('active');
                    // Ensure image is loaded before showing
                    lightboxImage.onload = () => {
                        console.log('Image loaded:', imgSrc);
                        setTimeout(() => {
                            lightboxImage.classList.add('active');
                        }, 50);
                    };
                });
            });

            // Close lightbox
            closeButton.addEventListener('click', () => {
                lightboxImage.classList.remove('active');
                setTimeout(() => {
                    lightbox.classList.remove('active');
                }, 300);
            });

            // Previous image
            prevButton.addEventListener('click', () => {
                const newIndex = (currentIndex - 1 + imageSources.length) % imageSources.length;
                transitionImage(newIndex, 'prev');
                currentIndex = newIndex;
            });

            // Next image
            nextButton.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % imageSources.length;
                transitionImage(newIndex, 'next');
                currentIndex = newIndex;
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!lightbox.classList.contains('active')) return;
                
                if (e.key === 'Escape') {
                    closeButton.click();
                } else if (e.key === 'ArrowLeft' && !isTransitioning) {
                    prevButton.click();
                } else if (e.key === 'ArrowRight' && !isTransitioning) {
                    nextButton.click();
                }
            });
        }
    }

    // Initialize share button
    function initializeShareButton() {
        const shareButton = document.getElementById('share-btn');
        const notification = document.getElementById('share-notification');
        if (shareButton && notification) {
            shareButton.addEventListener('click', function() {
                navigator.clipboard.writeText(window.location.href)
                    .then(() => {
                        notification.classList.add('show');
                        setTimeout(() => {
                            notification.classList.remove('show');
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
            });
        }
    }

    // Initialize close button
    function initializeCloseButton() {
        const closeBtn = document.getElementById('close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                handlePageTransition('index.html');
            });
        }
    }

    // Initialize the current page
    initializePage();
}); 