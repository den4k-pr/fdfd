document.addEventListener("DOMContentLoaded", () => {
  const statsContainer = document.querySelector(".s5-cards");
  if (!statsContainer) return;

  const animateNumbers = (element) => {
    const targetText = element.textContent.trim();
    
    // Шукаємо тільки цифри (включаючи крапки/коми)
    const numericMatch = targetText.match(/[\d.,]+/);
    if (!numericMatch) return;

    const numericString = numericMatch[0];
    const hasDot = numericString.includes('.');
    
    // Чисте число для математичних розрахунків
    const targetValue = parseFloat(numericString.replace(/\./g, '').replace(/,/g, '.'));
    
    // Витягуємо все, що до/після числа (наприклад, "+")
    const prefix = targetText.split(numericString)[0] || "";
    const suffix = targetText.split(numericString)[1] || "";

    const duration = 2000; // Тривалість анімації (2 секунди)
    const startTime = performance.now();

    const updateNumber = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Плавне сповільнення наприкінці (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      const currentValue = easeProgress * targetValue;

      let formattedValue;
      if (hasDot) {
        formattedValue = Math.floor(currentValue).toString().replace(/\B(?=(\d{3})+(?!\n))/g, ".");
      } else {
        formattedValue = Math.floor(currentValue).toString();
      }

      // Виводимо проміжний результат
      element.textContent = `${prefix}${formattedValue}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        // У кінці встановлюємо точний оригінальний текст (наприклад, "40+", "110+")
        element.textContent = targetText;
      }
    };

    requestAnimationFrame(updateNumber);
  };

  // Intersection Observer для запуску анімації при скролі
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.2 // Спрацює, коли блок з'явиться на 20%
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Знаходимо всі числа з класом .s5-val всередині .s5-cards
        const numbers = entry.target.querySelectorAll(".s5-val");
        numbers.forEach(num => animateNumbers(num));
        
        // Вимикаємо спостереження після запуску
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  observer.observe(statsContainer);
});