const lazyVideos = document.querySelectorAll('.lazy-video');

const forceVideoPlay = (video) => {
  const tryPlay = () => {
    const promise = video.play();

    if (promise !== undefined) {
      promise
        .then(() => {
          video.classList.add('is-playing');
        })
        .catch(() => {
          setTimeout(tryPlay, 300);
        });
    }
  };

  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;

  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  tryPlay();

  video.addEventListener('canplay', tryPlay);
  video.addEventListener('loadeddata', tryPlay);
  video.addEventListener('suspend', tryPlay);
  video.addEventListener('stalled', tryPlay);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;

      if (entry.isIntersecting) {

        if (!video.src) {
          video.src = video.dataset.src;
          video.load();
        }

        forceVideoPlay(video);

      } else {
        video.pause();
      }
    });
  },
  {
    threshold: 0.35,
    rootMargin: '200px 0px'
  }
);

lazyVideos.forEach((video) => {
  observer.observe(video);
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lazyVideos.forEach((video) => {
      if (video.src) {
        forceVideoPlay(video);
      }
    });
  }
});

window.addEventListener('focus', () => {
  lazyVideos.forEach((video) => {
    if (video.src) {
      forceVideoPlay(video);
    }
  });
});

window.addEventListener('touchstart', () => {
  lazyVideos.forEach((video) => {
    if (video.src) {
      forceVideoPlay(video);
    }
  });
}, { once: true });