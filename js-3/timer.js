document.addEventListener("DOMContentLoaded", () => {

  function start24hTimer(containerSelector, itemSelector, storageKey) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const values = container.querySelectorAll(itemSelector);
    if (values.length < 3) return;

    const TOTAL_TIME = 24 * 60 * 60 * 1000;

    let startTime = localStorage.getItem(storageKey);

    // Якщо немає старту — задаємо новий
    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(storageKey, startTime);
    } else {
      startTime = parseInt(startTime, 10);
    }

    function updateTimer() {
      const now = Date.now();
      let elapsed = now - startTime;

      // Ресет після 24 годин або якщо щось пішло не так
      if (elapsed >= TOTAL_TIME || elapsed < 0) {
        startTime = now;
        localStorage.setItem(storageKey, startTime);
        elapsed = 0;
      }

      const remaining = TOTAL_TIME - elapsed;

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      values[0].textContent = String(hours).padStart(2, "0");
      values[1].textContent = String(minutes).padStart(2, "0");
      values[2].textContent = String(seconds).padStart(2, "0");
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // Оновлений виклик під селектори нашого футера (.footer-timer та .timer-box)
  start24hTimer(".footer-timer", ".timer-box", "footerTimerStartTime");

});








document.addEventListener("DOMContentLoaded", function () {
  // Знаходимо елементи хвилин та секунд
  const minsEl = document.getElementById("gift-timer-mins");
  const secsEl = document.getElementById("gift-timer-secs");

  // Якщо елементів немає на сторінці - зупиняємо скрипт
  if (!minsEl || !secsEl) return;

  // Тривалість таймера: 60 хвилин у мілісекундах (60 * 60 * 1000)
  const duration = 3600000; 

  // Функція для запуску нового циклу
  function startNewCycle() {
    const newEndTime = Date.now() + duration;
    localStorage.setItem("giftTimerEndTime", newEndTime);
    return newEndTime;
  }

  // Отримуємо час закінчення з кешу
  let endTime = localStorage.getItem("giftTimerEndTime");

  // Якщо часу в кеші немає, АБО час вже минув - запускаємо таймер наново
  if (!endTime || Date.now() > parseInt(endTime, 10)) {
    endTime = startNewCycle();
  } else {
    endTime = parseInt(endTime, 10);
  }

  // Функція оновлення цифр
  function updateTimer() {
    let remainingTime = endTime - Date.now();

    // Якщо таймер дійшов до нуля (або менше) - оновлюємо цикл
    if (remainingTime <= 0) {
      endTime = startNewCycle();
      remainingTime = duration;
    }

    // Рахуємо хвилини та секунди
    let totalSeconds = Math.floor(remainingTime / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    // Додаємо нуль попереду, якщо цифра менша за 10 (напр. "09" замість "9")
    minsEl.textContent = minutes < 10 ? "0" + minutes : minutes;
    secsEl.textContent = seconds < 10 ? "0" + seconds : seconds;
  }

  // Оновлюємо одразу під час завантаження і далі щосекунди
  updateTimer();
  setInterval(updateTimer, 1000);
});