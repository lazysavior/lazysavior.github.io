// 作品集互動：App 畫面切換、行業切換、開啟可操作的後台、報價單蓋章
(() => {
  // App 畫面切換
  const screenNames = { explore: '探索', detail: '商品頁', add: '記一筆', list: '清單', search: '搜尋' };
  const appImg = document.getElementById('app-screen');
  const tabs = document.querySelectorAll('.screen-tabs button');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      const key = btn.dataset.screen;
      appImg.src = `assets/app/${key}.jpg`;
      appImg.alt = `App 畫面：${screenNames[key]}`;
      appImg.parentElement.scrollTop = 0;
    });
  });

  // 行業切換（LINE 預約示範）
  const frame = document.getElementById('line-frame');
  const chips = document.querySelectorAll('.industry button');
  chips.forEach((btn) => {
    btn.addEventListener('click', () => {
      chips.forEach((b) => b.setAttribute('aria-checked', String(b === btn)));
      frame.src = btn.dataset.src;
      frame.title = `LINE 預約示範：${btn.textContent.trim()}`;
    });
  });

  // 可操作的後台：按了才載入
  const dialog = document.getElementById('live-dialog');
  const liveFrame = document.getElementById('live-frame');
  const liveTitle = document.getElementById('live-title');
  document.querySelectorAll('.live-open, .open-live').forEach((btn) => {
    btn.addEventListener('click', () => {
      liveFrame.src = btn.dataset.src;
      liveFrame.title = btn.dataset.title;
      if (liveTitle) liveTitle.textContent = btn.dataset.title; // 視窗上方的標題列寫現在打開的是哪一件
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else window.open(btn.dataset.src, '_blank', 'noopener');
    });
  });
  dialog.addEventListener('close', () => { liveFrame.src = 'about:blank'; });

  // 報價單捲到眼前時蓋章（只蓋一次）
  const seal = document.querySelector('.seal');
  if (seal && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    seal.style.opacity = '0';
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        seal.style.opacity = '';
        seal.classList.add('stamp');
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(seal);
  }
})();
