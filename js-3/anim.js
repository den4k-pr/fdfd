document.addEventListener("DOMContentLoaded", () => {
  const animateNumbers = (element) => {
    const originalHTML = element.innerHTML;
    const targetText = element.textContent.trim();

    // Шукаємо перше число з роздільниками (крапками або комами)
    const match = targetText.match(/[\d.,]+/);
    if (!match) return;

    const numStr = match[0];
    const hasComma = numStr.includes(",");
    const hasDot = numStr.includes(".");

    // Отримуємо чисте число
    const targetValue = parseInt(numStr.replace(/[,.]/g, ""), 10);
    if (isNaN(targetValue)) return;

    const duration = 2000; // Тривалість анімації (2 сек)
    const startTime = performance.now();

    const updateNumber = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Плавне сповільнення (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(easeProgress * targetValue);

      // Форматуємо число відповідно до оригінального роздільника
      let formattedValue = currentValue.toString();
      if (hasComma) {
        formattedValue = currentValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      } else if (hasDot) {
        formattedValue = currentValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }

      // Замінюємо тільки числову частину, зберігаючи вкладені теги (span тощо)
      element.innerHTML = originalHTML.replace(numStr, formattedValue);

      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        // У кінці повертаємо точний точний початковий HTML
        element.innerHTML = originalHTML;
      }
    };

    requestAnimationFrame(updateNumber);
  };

  // Спостерігач за появою елементів у зоні видимості
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateNumbers(entry.target);
        observer.unobserve(entry.target); // Запускаємо лише один раз
      }
    });
  }, observerOptions);

  // Вибираємо всі потрібні елементи за їхніми класами
  const targetElements = document.querySelectorAll(".s23__stat-val, .s20__pill-num");
  targetElements.forEach((el) => observer.observe(el));
});