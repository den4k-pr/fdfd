const s6Swiper = new Swiper('.s6-swiper', {
  slidesPerView: 'auto',
  spaceBetween: 12,
  loop: true,
  
  // Прив'язка навігації
  navigation: {
    nextEl: '.s6 .swiper-button-next',
    prevEl: '.s6 .swiper-button-prev',
  },

  // Прив'язка пагінації
  pagination: {
    el: '.s6 .swiper-pagination',
    clickable: true,
  },
});

document.addEventListener('DOMContentLoaded', () => {
  const giftBadge = document.querySelector('.s19-gift');

  const s19Swiper = new Swiper('.s19-swiper', {
    slidesPerView: 1,
    loop: true,
    speed: 500,
    effect: 'creative',
    creativeEffect: {
      prev: {
        // Попередній слайд ховається вліво
        translate: ['-100%', 0, 0],
        opacity: 0
      },
      next: {
        // Наступний слайд масштабується, стає напівпрозорим і зсувається вправо-вгору
        translate: ['45%', '-25%', 0],
        scale: 0.65,
        opacity: 1,
      }
    },
    navigation: {
      nextEl: '.s19 .swiper-button-next',
      prevEl: '.s19 .swiper-button-prev',
    },
    pagination: {
      el: '.s19 .swiper-pagination',
      clickable: true,
    },
    on: {
      slideChangeTransitionStart: function () {
        if (giftBadge) {
          giftBadge.classList.add('s19-gift-animating');
        }
      },
      slideChangeTransitionEnd: function () {
        if (giftBadge) {
          giftBadge.classList.remove('s19-gift-animating');
        }
      }
    }
  });
});