// Ініціалізація слайдера
document.addEventListener('DOMContentLoaded', function() {
  const reviewsSwiper = new Swiper('.s24__swiper', {
    slidesPerView: 'auto',
    loop: true,
    spaceBetween: 24, // Відстань між слайдами
    slidesOffsetBefore: 24, // Відступ зліва (щоб перший слайд був рівно по сітці)
    slidesOffsetAfter: 24, // Відступ справа
    
    // Навігація
    navigation: {
      nextEl: '.s24__btn--next',
      prevEl: '.s24__btn--prev',
    },
  });
});