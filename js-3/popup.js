document.addEventListener("DOMContentLoaded", () => {

  /* =========================================
     1. Таймер (Логіка 24 годин) - БЕЗ ЗМІН
     ========================================= */
  function start24hTimer(containerSelector, itemSelector, storageKey) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const values = container.querySelectorAll(itemSelector);
    if (values.length < 3) return;

    const TOTAL_TIME = 24 * 60 * 60 * 1000;
    let startTime = localStorage.getItem(storageKey);

    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(storageKey, startTime);
    } else {
      startTime = parseInt(startTime, 10);
    }

    function updateTimer() {
      const now = Date.now();
      let elapsed = now - startTime;

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

  // Виклик 24-годинного таймера для попапу
  start24hTimer(".popup-timer-row", ".popup-t-box", "popupTimerStartTime");


  /* =========================================
     2. Відкриття / Закриття попапу
     ========================================= */
  const popup = document.getElementById('join-popup');
  const closeBtn = document.getElementById('popup-close');
  const openButtons = document.querySelectorAll('.open_popup');

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      popup.classList.add('active');
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      popup.classList.remove('active');
    });
  }

  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.classList.remove('active');
    }
  });


  /* =========================================
     3. Збір даних, валідація та відправка в TG
     ========================================= */
  const tgForm = document.getElementById('tg-form');
  const errorMsg = document.getElementById('popup-error');
  
  // Регулярний вираз для перевірки email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Функція для безпечного виводу HTML у Telegram
  function escapeHtml(text) {
    if (!text) return 'not set';
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
  }

  // Збір UTM-міток
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || 'not set',
      medium: params.get('utm_medium') || 'not set',
      campaign: params.get('utm_campaign') || 'not set',
      content: params.get('utm_content') || 'not set',
      term: params.get('utm_term') || 'not set'
    };
  }

  if (tgForm) {
    tgForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      
      // Скидаємо повідомлення про помилку
      errorMsg.classList.remove('show');
      errorMsg.textContent = '';

      const name = document.getElementById('user_name').value.trim();
      const email = document.getElementById('user_email').value.trim();

      // Валідація
      if (!name || !email) {
        errorMsg.textContent = 'Please fill in all fields.';
        errorMsg.classList.add('show');
        return;
      }

      if (!emailRegex.test(email)) {
        errorMsg.textContent = 'Please enter a valid email address.';
        errorMsg.classList.add('show');
        return;
      }

      // Перевіряємо чи підключено data.js
      if (typeof TG_CONFIG === 'undefined' || !TG_CONFIG.BOT_TOKEN || !TG_CONFIG.CHAT_ID) {
        errorMsg.textContent = 'Configuration error. Please contact support.';
        errorMsg.classList.add('show');
        console.error("TG_CONFIG is missing. Make sure data.js is loaded.");
        return;
      }

      const submitBtn = tgForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.textContent = 'SENDING...';
      submitBtn.disabled = true;

      // Збираємо додаткові дані
      const utm = getUTMParams();
      const domain = window.location.hostname || 'Unknown';
      const currentUrl = window.location.href;
      const referrer = document.referrer || 'Direct / None';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
      const resolution = `${window.screen.width}x${window.screen.height}`;

      // Формуємо красиве повідомлення у HTML форматі
      const textMessage = `
🎉 <b>New Lead (Mobility Club)!</b>

👤 <b>Name:</b> ${escapeHtml(name)}
✉️ <b>Email:</b> ${escapeHtml(email)}

🌍 <b>Domain:</b> ${escapeHtml(domain)}
🔗 <b>URL:</b> ${escapeHtml(currentUrl)}
⬅️ <b>Referrer:</b> ${escapeHtml(referrer)}

📊 <b>UTM Parameters:</b>
• Source: ${escapeHtml(utm.source)}
• Medium: ${escapeHtml(utm.medium)}
• Campaign: ${escapeHtml(utm.campaign)}
• Content: ${escapeHtml(utm.content)}
• Term: ${escapeHtml(utm.term)}

⚙️ <b>Technical Info:</b>
• Timezone: ${escapeHtml(timezone)}
• Resolution: ${escapeHtml(resolution)}
`;

      // API URL (з parse_mode=HTML)
      const url = `https://api.telegram.org/bot${TG_CONFIG.BOT_TOKEN}/sendMessage`;
      
      const payload = {
        chat_id: TG_CONFIG.CHAT_ID,
        text: textMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          // Успіх -> редирект
          window.location.href = 'https://zubalenok.online/shop/item/13230';
        } else {
          // Помилка сервера Telegram
          errorMsg.textContent = 'Something went wrong. Please try again later.';
          errorMsg.classList.add('show');
          submitBtn.textContent = originalBtnText;
          submitBtn.disabled = false;
        }
      } catch (error) {
        console.error('Telegram Error:', error);
        // Технічна помилка (немає інтернету, блокування запиту)
        errorMsg.textContent = 'Connection error. Please check your internet and try again.';
        errorMsg.classList.add('show');
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }
    });
  }

});