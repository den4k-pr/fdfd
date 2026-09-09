(function () {
  console.log('[VideoSlides] Script initialized for s7');

  // Карта відео (якщо потрібно)
  var VIDEO_MAP = {};

  // 1. Ініціалізація Swiper Слайдера
  function initSwiper() {
    var gallerySwiperEl = document.querySelector('.s7-swiper');
    if (gallerySwiperEl && typeof Swiper !== 'undefined') {
      var swiper = new Swiper(gallerySwiperEl, {
        slidesPerView: 1.3,
        spaceBetween: 20,
        pagination: {
          el: '.s7-pagination',
          clickable: true
        },
        navigation: {
          nextEl: '.s7-next',
          prevEl: '.s7-prev'
        }
      });

      swiper.on('slideChangeTransitionStart', killAllVideos);
      swiper.on('sliderMove', killAllVideos);
    }
  }

  // 2. Функція витягування посилання на відео з data-video
  function getVideoUrl(slide, img) {
    if (slide) {
      var directUrl = slide.getAttribute('data-video');
      if (directUrl) return directUrl;
    }
    if (!img) return null;
    var src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    var filename = src.split('/').pop().split('?')[0];
    return VIDEO_MAP[filename] || null;
  }

  // 3. Знищення активних плеєрів та відновлення фотографій
  function killAllVideos() {
    var videos = document.querySelectorAll('.s7-slide video');
    videos.forEach(function (v) {
      v.pause();
      v.src = '';
      v.load();
      var parentSlide = v.closest('.s7-slide');
      if (parentSlide) {
        var parentImg = parentSlide.querySelector('.s7-img');
        if (parentImg) parentImg.style.cssText = '';
        var playBtn = parentSlide.querySelector('.s7-play-btn');
        if (playBtn) playBtn.style.display = 'block';
      }
      v.remove();
    });
  }

  // 4. Відкриття та відтворення відео
  function openVideo(slide, url) {
    killAllVideos();

    slide.style.setProperty('position', 'relative', 'important');
    slide.style.setProperty('overflow', 'hidden', 'important');

    var img = slide.querySelector('.s7-img');
    if (img) {
      img.style.cssText = 'visibility: hidden !important; opacity: 0 !important;';
    }
    var playBtn = slide.querySelector('.s7-play-btn');
    if (playBtn) {
      playBtn.style.display = 'none';
    }

    var v = document.createElement('video');
    v.setAttribute('src', url);
    v.setAttribute('controls', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('autoplay', '');
    v.setAttribute('preload', 'auto');
    v.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100% !important;min-height:100%;object-fit:cover;z-index:99;background:#000;display:block;border-radius:12px;outline:none;';

    v.addEventListener('ended', function () { 
      killAllVideos(); 
    });

    slide.appendChild(v);

    var p = v.play();
    if (p && typeof p.then === 'function') {
      p.catch(function () {
        v.muted = true;
        v.play();
      });
    }
  }

  // 5. Глобальні слухачі подій
  function initGlobalListeners() {
    initSwiper();

    document.addEventListener('click', function (e) {
      if (e.target.tagName === 'VIDEO') return;

      var slide = e.target.closest('.s7-slide');
      if (!slide) return;

      var img = slide.querySelector('.s7-img');
      var url = getVideoUrl(slide, img);
      
      if (url) {
        e.preventDefault();
        e.stopPropagation();
        openVideo(slide, url);
      }
    }, true);

    document.addEventListener('touchmove', function (e) {
      if (e.target.tagName === 'VIDEO') return;
      if (e.target.closest('.s7-slide')) {
        killAllVideos();
      }
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalListeners);
  } else {
    initGlobalListeners();
  }
})();