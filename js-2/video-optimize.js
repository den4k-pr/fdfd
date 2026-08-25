document.addEventListener('DOMContentLoaded', () => {
    const LAZY_THRESHOLD = 0.01;

    // ==============================================================
    // 1. ЛЕЗИВНЕ ЗАВАНТАЖЕННЯ (Оптимізоване)
    // ==============================================================
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const video = entry.target;
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
                video.preload = 'metadata';
                video.load();
            }
            lazyObserver.unobserve(video);
        });
    }, { threshold: LAZY_THRESHOLD, rootMargin: '200px 0px' });

    document.querySelectorAll('.video-player').forEach(v => lazyObserver.observe(v));

    // ==============================================================
    // 2. КАСТОМНИЙ ПЛЕЄР (З урахуванням мобільних обмежень)
    // ==============================================================
    document.querySelectorAll('.video-card-item').forEach(card => {
        const video = card.querySelector('video');
        const wrapper = card.querySelector('.video-wrapper-big, .video-wrapper-small');
        if (!video || !wrapper) return;

        video.controls = false;
        video.removeAttribute('controls');

        // Перевіряємо, чи оверлей ВЖЕ Є в HTML (щоб не створювати дублікат)
        let overlay = wrapper.querySelector('.video-overlay');
        
        if (!overlay) {
            // Створюємо тільки якщо його немає в розмітці
            overlay = document.createElement('div');
            overlay.className = 'video-overlay';
            overlay.innerHTML = `
                <div class="video-play-btn" aria-label="Play">
                    <img src="./images-2/img1.webp"/>
                </div>
            `;
            wrapper.style.position = 'relative';
            wrapper.appendChild(overlay);
        }

        const iconPlay = overlay.querySelector('.icon-play');
        const iconPause = overlay.querySelector('.icon-pause');

        let isHandling = false;

        const setIcon = (playing) => {
            if(iconPlay) iconPlay.style.display = playing ? 'none' : '';
            if(iconPause) iconPause.style.display = playing ? '' : 'none';
        };

        const stopAllOthers = () => {
            document.querySelectorAll('.video-card-item video').forEach(v => {
                if (v !== video && !v.paused) {
                    v.pause();
                    const otherOverlay = v.closest('.video-card-item')?.querySelector('.video-overlay');
                    if (otherOverlay) {
                        const pIcon = otherOverlay.querySelector('.icon-play');
                        const paIcon = otherOverlay.querySelector('.icon-pause');
                        if(pIcon) pIcon.style.display = ''; 
                        if(paIcon) paIcon.style.display = 'none'; 
                    }
                }
            });
        };

        const togglePlay = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (isHandling) return;
            isHandling = true;
            setTimeout(() => { isHandling = false; }, 250);

            // Якщо src ще не підставився через LazyLoad — підставляємо негайно СИНХРОННО
            if (!video.src && video.dataset.src) {
                video.src = video.dataset.src;
            }

            // Звук вмикаємо СИНХРОННО перед викликом play
            video.muted = false;

            if (video.paused) {
                stopAllOthers();
                
                // Викликаємо .play() прямо тут
                video.play()
                    .then(() => {
                        setIcon(true);
                    })
                    .catch(err => {
                        console.log('Спроба запуску зі звуком заблокована браузером, вмикаємо без звуку:', err);
                        // ФОЛБЕК для iOS (на випадок режиму енергозбереження)
                        video.muted = true;
                        video.play()
                            .then(() => setIcon(true))
                            .catch(e => console.error('Повна блокування медіа:', e));
                    });
            } else {
                video.pause();
                setIcon(false);
            }
        };

        overlay.addEventListener('click', togglePlay);

        // Синхронізація станів через нативні події тегу video
        video.addEventListener('play', () => {
            setIcon(true);
            overlay.classList.add('is-playing');
        });
        video.addEventListener('pause', () => {
            setIcon(false);
            overlay.classList.remove('is-playing');
        });
        video.addEventListener('ended', () => {
            setIcon(false);
            overlay.classList.remove('is-playing');
        });
    });
});