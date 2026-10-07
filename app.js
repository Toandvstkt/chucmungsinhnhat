'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const config = window.BIRTHDAY_CONFIG || {};
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Private browsing still works. */ } }
  };
  let language = storage.get('birthday-language') || config.defaultLanguage || 'id';
  if (!['id', 'en'].includes(language)) language = 'id';
  const words = {
    en: {
      you: 'you', me: 'Me', play: 'Play music', pause: 'Pause music', secrets: 'secrets',
      musicUnavailable: 'Music is unavailable in this browser. The magic still works ♡',
      found: 'A little secret, found!', already: 'You’ve already found this little secret ♡',
      wishBefore: 'Three candles. One wish. A sky full of possibility.',
      wishAfter: 'Your wish is on its way. May it find you at just the right time. ♡',
      wishPartial: (n) => `${n} candle${n === 1 ? '' : 's'} left. Keep your wish close.`,
      giftReady: 'All five little secrets are yours. Your present is ready! ♡',
      openGift: 'Open your present', hint: 'The magic is still asleep', journal: 'Open the discovery journal',
      flip: 'Flip card: ', missingPhoto: 'Your photo could not load; the illustration is here instead.',
      resetAsk: 'Tap again within 5 seconds to start fresh.', resetDone: 'A fresh little adventure awaits.',
      flowers: ['May your days be full of reasons to smile. ☀', 'May your heart always have a quiet place to rest. ♡', 'May you be brave enough to follow your own dreams. ✧', 'May love find you in a thousand little ways. ♡', 'May a little luck meet you around every corner. ✿'],
      flowerHint: 'Even flowers have a secret rhythm.', saved: 'Your birthday keepsake is ready ♡',
      clues: [
        ['A path of starlight', 'Three lights remember a path. Let your finger follow it.', '', 'orbit'],
        ['Patient little petals', 'Inside a letter, a quiet flower waits for someone who stays.', '', 'ink'],
        ['Under the silver', 'Not everything on a postcard is meant to stay covered.', '', 'scratch'],
        ['A secret rhythm', 'A patient flower knows which colors the garden wants to hear.', '', 'garden'],
        ['Beyond the last line', 'Every story has a last page. Sometimes its corner hides the night.', '', 'moon']
      ]
    },
    id: {
      you: 'kamu', me: 'Aku', play: 'Putar musik', pause: 'Jeda musik', secrets: 'rahasia',
      musicUnavailable: 'Musik tidak tersedia di browser ini. Keajaibannya tetap ada ♡',
      found: 'Satu rahasia kecil ditemukan!', already: 'Kamu sudah menemukan rahasia kecil ini ♡',
      wishBefore: 'Tiga lilin. Satu harapan. Langit penuh kemungkinan.',
      wishAfter: 'Harapanmu sedang terbang. Semoga datang di waktu yang paling tepat. ♡',
      wishPartial: (n) => `Tersisa ${n} lilin. Simpan harapanmu di hati.`,
      giftReady: 'Kelima rahasia sudah kamu temukan. Hadiahmu siap dibuka! ♡',
      openGift: 'Buka hadiahmu', hint: 'Keajaibannya masih tertidur', journal: 'Buka jurnal penjelajahan',
      flip: 'Balik kartu: ', missingPhoto: 'Fotomu tidak dapat dimuat; ilustrasinya tetap tersedia.',
      resetAsk: 'Sentuh lagi dalam 5 detik untuk memulai dari awal.', resetDone: 'Petualangan kecil yang baru menanti.',
      flowers: ['Semoga harimu penuh alasan untuk tersenyum. ☀', 'Semoga hatimu selalu punya tempat tenang untuk beristirahat. ♡', 'Semoga kamu berani mengikuti impianmu sendiri. ✧', 'Semoga cinta menemukanmu dalam ribuan cara kecil. ♡', 'Semoga sedikit keberuntungan menantimu di setiap sudut. ✿'],
      flowerHint: 'Bunga-bunga pun punya irama rahasia.', saved: 'Kartu kenangan ulang tahunmu sudah siap ♡',
      clues: [
        ['Jalan cahaya bintang', 'Tiga cahaya mengingat sebuah jalan. Biarkan jarimu mengikutinya.', '', 'orbit'],
        ['Kelopak yang sabar', 'Di dalam surat, sekuntum bunga menunggu seseorang yang mau tinggal.', '', 'ink'],
        ['Di balik perak', 'Tidak semua yang menutupi kartu pos harus dibiarkan utuh.', '', 'scratch'],
        ['Irama rahasia', 'Bunga yang sabar tahu warna apa yang ingin didengar taman.', '', 'garden'],
        ['Setelah baris terakhir', 'Setiap cerita punya halaman terakhir. Kadang sudutnya menyimpan malam.', '', 'moon']
      ]
    }
  };
  const t = () => words[language];
  const secretIds = ['orbit', 'ink', 'scratch', 'garden', 'moon'];
  let saved = [];
  try { const parsed = JSON.parse(storage.get('birthday-hunt-v2') || '[]'); if (Array.isArray(parsed)) saved = parsed; } catch { /* Ignore corrupted progress. */ }
  const found = new Set(saved.filter((id) => secretIds.includes(id)));
  let activeFlower = null;
  let toastTimer, resetTimer, resetArmed = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const staticNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const dynamicParents = '#friend-name,#letter-recipient,#letter-copy,#letter-sender,#sender-name,#wish-status,#flower-wish,#gift-description,#gift-button,#discovery-count,#music-label,#final-message,#clue-list,#reset-note';
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style,' + dynamicParents)) continue;
    const en = node.nodeValue.trim();
    const id = window.STATIC_TRANSLATIONS?.[en];
    if (id) staticNodes.push({ node, en: node.nodeValue, id: node.nodeValue.replace(en, id) });
  }
  const staticAttributes = $$('[aria-label]').map((el) => ({ el, en: el.getAttribute('aria-label'), id: window.STATIC_TRANSLATIONS?.[el.getAttribute('aria-label')] })).filter((item) => item.id);
  function showToast(message) {
    $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3600);
  }
  function openDialog(dialog) { if (dialog.open) return; dialog.showModal(); document.body.style.overflow = 'hidden'; }
  $$('dialog').forEach((dialog) => {
    dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  function renderJournal() {
    const list = $('#clue-list'); list.replaceChildren();
    t().clues.forEach(([title, hint, target, id], index) => {
      const li = document.createElement('li'); if (found.has(id)) li.classList.add('found');
      const icon = document.createElement('span'); icon.className = 'clue-icon'; icon.textContent = found.has(id) ? '✓' : String(index + 1); icon.setAttribute('aria-hidden', 'true');
      const detail = document.createElement('div');
      const strong = document.createElement('strong'); strong.textContent = title + (found.has(id) ? ' ✓' : '');
      const text = document.createElement('p'); text.textContent = hint; detail.append(strong, text);
      li.append(icon, detail); list.append(li);
    });
  }
  function renderProgress() {
    $('#discovery-count').textContent = `${found.size} / 5 ${t().secrets}`;
    $('#discovery-button').setAttribute('aria-label', `${t().journal}: ${found.size} / 5`);
    $$('.gift-progress > span').forEach((dot, index) => dot.classList.toggle('found', found.has(secretIds[index])));
    $('.gift-progress').setAttribute('aria-label', `${found.size} / 5 ${t().secrets}`);
    const unlocked = found.size === 5; $('.gift-box').classList.toggle('unlocked', unlocked);
    const button = $('#gift-button'); button.disabled = !unlocked; button.replaceChildren(document.createTextNode(unlocked ? t().openGift : t().hint));
    const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = unlocked ? '↗' : '✧'; button.append(arrow);
    $('#gift-description').textContent = unlocked ? t().giftReady : language === 'id' ? 'Temukan 5 rahasia untuk membuka hadiah terakhir. Detail kecil punya cerita untuk dibagikan.' : 'Find all 5 secrets to open your final present. The little details have a story to tell.';
    renderJournal();
    document.dispatchEvent(new CustomEvent('birthday-progress', { detail: [...found] }));
  }
  function discover(id) {
    if (found.has(id)) return false;
    found.add(id); storage.set('birthday-hunt-v2', JSON.stringify([...found])); renderProgress();
    const name = t().clues.find((clue) => clue[3] === id)[0]; showToast(`${t().found} ${name} · ${found.size}/5`);
    confetti(found.size === 5 ? 150 : 45); return true;
  }
  function renderCandles() {
    const left = $$('.candle:not(.off)').length;
    $('#wish-status').textContent = left === 3 ? t().wishBefore : left === 0 ? t().wishAfter : t().wishPartial(left);
    $('#relight').hidden = left !== 0; $('#blow-all').disabled = left === 0;
  }
  function putOut(candle) {
    if (candle.classList.contains('off')) return;
    candle.classList.add('off'); candle.setAttribute('aria-pressed', 'true'); renderCandles();
    if ($$('.candle.off').length === 3) confetti(120);
  }
  $$('.candle').forEach((candle) => candle.addEventListener('click', () => putOut(candle)));
  $('#blow-all').addEventListener('click', () => $$('.candle').forEach(putOut));
  $('#relight').addEventListener('click', () => { $$('.candle').forEach((candle) => { candle.classList.remove('off'); candle.setAttribute('aria-pressed', 'false'); }); renderCandles(); });
  const openLetter = () => { $('.envelope').classList.add('opened'); openDialog($('#letter-dialog')); };
  $('#open-letter').addEventListener('click', openLetter); $('#letter-button').addEventListener('click', openLetter);
  $$('.memory-card').forEach((card) => card.addEventListener('click', () => {
    card.classList.toggle('flipped'); card.setAttribute('aria-pressed', String(card.classList.contains('flipped')));
  }));
  $$('.garden-flower').forEach((flower) => flower.addEventListener('click', () => {
    activeFlower = Number(flower.dataset.flower); $('#flower-wish').textContent = t().flowers[activeFlower]; confetti(18);
  }));
  $('#discovery-button').addEventListener('click', () => openDialog($('#discovery-dialog')));
  $('#gift-button').addEventListener('click', () => { if (found.size !== 5) return; openDialog($('#gift-dialog')); document.dispatchEvent(new CustomEvent('birthday-finale')); });
  $('#celebrate').addEventListener('click', () => document.dispatchEvent(new CustomEvent('birthday-fireworks')));
  document.addEventListener('birthday-discover', (event) => { if (secretIds.includes(event.detail)) discover(event.detail); });
  $('#reset-progress').addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true; $('#reset-note').textContent = t().resetAsk; clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { resetArmed = false; $('#reset-note').textContent = ''; }, 5000); return;
    }
    clearTimeout(resetTimer); resetArmed = false; found.clear(); storage.set('birthday-hunt-v2', '[]');
    $$('.candle').forEach((candle) => { candle.classList.remove('off'); candle.setAttribute('aria-pressed', 'false'); });
    $$('.memory-card').forEach((card) => { card.classList.remove('flipped'); card.setAttribute('aria-pressed', 'false'); });
    activeFlower = null; $('#flower-wish').textContent = t().flowerHint; renderCandles(); renderProgress(); $('#reset-note').textContent = t().resetDone;
    document.dispatchEvent(new CustomEvent('birthday-reset'));
  });
  function renderLanguage() {
    document.documentElement.lang = language;
    document.title = language === 'id' ? 'Sedikit keajaiban ulang tahun ✨' : 'A little birthday magic ✨';
    $('#language').value = language; $('#language').setAttribute('aria-label', language === 'id' ? 'Bahasa' : 'Language');
    staticNodes.forEach(({ node, en, id }) => { node.nodeValue = language === 'id' ? id : en; });
    staticAttributes.forEach(({ el, en, id }) => { el.setAttribute('aria-label', language === 'id' ? id : en); });
    const content = config.content?.[language] || config.content?.en || {};
    $('#friend-name').textContent = config.friend || t().you; $('#letter-recipient').textContent = config.friend || t().you;
    $('#sender-name').textContent = (config.sender || t().me).toUpperCase(); $('#letter-sender').textContent = (config.sender || t().me) + ' ♡';
    $('#letter-copy').replaceChildren(); (content.letter || []).forEach((paragraph) => { const p = document.createElement('p'); p.textContent = paragraph; $('#letter-copy').append(p); });
    $('#letter-copy').lang = config.messageLanguage || language;
    $('#final-message').textContent = content.finalMessage || '';
    $('#final-message').lang = config.messageLanguage || language;
    $('#reward-name').textContent = config.friend || t().you;
    const giftLink = $('#real-gift'); giftLink.hidden = true; giftLink.removeAttribute('href');
    try { const url = new URL(config.giftUrl || ''); if (['https:', 'http:'].includes(url.protocol)) { giftLink.href = url.href; giftLink.hidden = false; } } catch { /* Optional gift link. */ }
    $$('.memory-card').forEach((card, index) => {
      const memory = content.memories?.[index]; if (!memory) return;
      card.querySelector('.memory-caption').firstChild.nodeValue = memory.title + ' ';
      card.querySelector('.memory-message').textContent = memory.message; card.setAttribute('aria-label', t().flip + memory.title);
      const picture = card.querySelector('.memory-image'); const existing = picture.querySelector('img'); if (existing) existing.remove();
      if (memory.image) {
        const img = document.createElement('img'); img.src = memory.image; img.alt = memory.title; img.loading = 'lazy';
        img.addEventListener('error', () => { img.remove(); showToast(t().missingPhoto); }, { once: true }); picture.append(img);
      }
    });
    $('#flower-wish').textContent = activeFlower === null ? t().flowerHint : t().flowers[activeFlower]; renderCandles(); renderProgress(); renderMusic();
    document.dispatchEvent(new CustomEvent('birthday-language', { detail: language }));
  }
  $('#language').addEventListener('change', (event) => {
    language = event.target.value; storage.set('birthday-language', language); renderLanguage();
    $('#toast').classList.remove('visible'); $('#reset-note').textContent = ''; resetArmed = false; clearTimeout(resetTimer);
  });
  // Try on entry; if autoplay is blocked, resume on the first real gesture.
  // A manual pause lasts for this visit and disables the automatic fallback.
  let audioContext = null, musicOn = false, musicTimer, audioGeneration = 0;
  let musicWanted = config.autoplayMusic !== false;
  const oscillators = new Set();
  const melody = [[67,.5],[67,.5],[69,1],[67,1],[72,1],[71,2],[67,.5],[67,.5],[69,1],[67,1],[74,1],[72,2],[67,.5],[67,.5],[79,1],[76,1],[72,1],[71,1],[69,2],[77,.5],[77,.5],[76,1],[72,1],[74,1],[72,2]];
  function renderMusic() { $('#music-label').textContent = musicOn ? t().pause : t().play; $('#music').setAttribute('aria-pressed', String(musicOn)); $('#music').setAttribute('aria-label', musicOn ? t().pause : t().play); }
  function scheduleMelody() {
    if (!musicOn || !audioContext) return;
    let at = audioContext.currentTime + .12;
    for (const [note, beats] of melody) {
      const length = beats * .38, oscillator = audioContext.createOscillator(), volume = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
      volume.gain.setValueAtTime(0, at); volume.gain.linearRampToValueAtTime(.065, at + .015); volume.gain.exponentialRampToValueAtTime(.001, at + length * .95);
      oscillator.connect(volume); volume.connect(audioContext.destination); oscillators.add(oscillator);
      oscillator.onended = () => { oscillators.delete(oscillator); oscillator.disconnect(); volume.disconnect(); };
      oscillator.start(at); oscillator.stop(at + length); at += length;
    }
    musicTimer = setTimeout(scheduleMelody, (at - audioContext.currentTime + 1.5) * 1000);
  }
  function removeMusicFallback() {
    document.removeEventListener('pointerdown', firstMusicGesture, true);
    document.removeEventListener('keydown', firstMusicGesture, true);
  }
  function enableMusicFallback() {
    if (!musicWanted) return;
    document.addEventListener('pointerdown', firstMusicGesture, { capture: true, passive: true });
    document.addEventListener('keydown', firstMusicGesture, { capture: true });
  }
  function stopMusic(manual = false) {
    if (manual) { musicWanted = false; removeMusicFallback(); }
    musicOn = false; audioGeneration++; clearTimeout(musicTimer);
    for (const oscillator of oscillators) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    renderMusic();
  }
  function startMusic(automatic = false) {
    if (musicOn || document.hidden || !musicWanted) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { removeMusicFallback(); if (!automatic) showToast(t().musicUnavailable); return; }
    const generation = ++audioGeneration;
    function activate() {
      if (generation !== audioGeneration || document.hidden || !musicWanted || musicOn) return;
      if (audioContext.state !== 'running') { enableMusicFallback(); return; }
      musicOn = true; removeMusicFallback(); scheduleMelody(); renderMusic();
    }
    try {
      if (!audioContext || audioContext.state === 'closed') audioContext = new Audio();
      if (audioContext.state === 'running') activate();
      else {
        // Invoke resume synchronously inside the gesture, before any await.
        const resumed = audioContext.resume();
        Promise.resolve(resumed).then(activate).catch(() => {
          if (generation !== audioGeneration || !musicWanted) return;
          enableMusicFallback(); if (!automatic) showToast(t().musicUnavailable);
        });
      }
    } catch { enableMusicFallback(); if (!automatic) showToast(t().musicUnavailable); }
  }
  function firstMusicGesture(event) {
    if (!musicWanted || musicOn || event.isTrusted === false) return;
    // The music control handles its own click, so the first tap never toggles twice.
    if (event.target?.closest?.('#music')) return;
    if (event.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Tab'].includes(event.key)) return;
    startMusic(true);
  }
  $('#music').addEventListener('click', () => {
    if (musicOn) stopMusic(true);
    else { musicWanted = true; enableMusicFallback(); startMusic(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic();
    else if (musicWanted) { enableMusicFallback(); startMusic(true); }
  });
  const canvas = $('#confetti'), ctx = canvas.getContext('2d');
  let particles = [], frame = null, lastTime = 0, width = innerWidth, height = innerHeight;
  function resizeCanvas() { width = innerWidth; height = innerHeight; const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = width * ratio; canvas.height = height * ratio; if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0); }
  resizeCanvas(); addEventListener('resize', resizeCanvas);
  function confetti(count) {
    if (!ctx || reducedMotion.matches) return;
    const colors = ['#bd5774', '#e6bd64', '#9eac8b', '#d998a4', '#9a8fb0'];
    for (let i = 0; i < Math.min(count, 200); i++) particles.push({ x: width * (.2 + Math.random() * .6), y: height * .3, vx: (Math.random() - .5) * 10, vy: -3 - Math.random() * 9, rotation: Math.random() * 6.28, spin: (Math.random() - .5) * .15, life: 0, color: colors[i % colors.length], size: 4 + Math.random() * 5 });
    particles = particles.slice(-400); if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(drawConfetti); }
  }
  function drawConfetti(time) {
    const step = Math.min((time - lastTime) / 16.67, 2); lastTime = time; ctx.clearRect(0, 0, width, height);
    particles = particles.filter((p) => p.y < height + 20 && p.life < 250);
    for (const p of particles) { p.x += p.vx * step; p.y += p.vy * step; p.vy += .15 * step; p.rotation += p.spin * step; p.life += step; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.globalAlpha = Math.max(0, 1 - p.life / 250); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .5); ctx.restore(); }
    if (particles.length) frame = requestAnimationFrame(drawConfetti); else { ctx.clearRect(0, 0, width, height); frame = null; }
  }
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { particles = []; if (frame) cancelAnimationFrame(frame); frame = null; if (ctx) ctx.clearRect(0, 0, width, height); } });
  $('#save-card').addEventListener('click', async () => {
    const card = document.createElement('canvas'); card.width = 1200; card.height = 1500; const c = card.getContext('2d'); if (!c) return;
    if (document.fonts) await document.fonts.ready;
    c.fillStyle = '#fcf7ed'; c.fillRect(0, 0, 1200, 1500); c.strokeStyle = '#decbb5'; c.lineWidth = 3; c.strokeRect(45, 45, 1110, 1410);
    c.textAlign = 'center'; c.fillStyle = '#a28271'; c.font = '24px Arial'; c.fillText(language === 'id' ? 'HARI UNTUK MERAYAKANMU' : 'A DAY TO CELEBRATE YOU', 600, 150);
    c.fillStyle = '#bb536e'; c.font = '76px Georgia'; c.fillText(language === 'id' ? 'Selamat ulang tahun,' : 'Happy birthday,', 600, 320);
    const name = config.friend || t().you; let size = 92; c.font = `${size}px Georgia`; while (c.measureText(name).width > 950 && size > 18) { size -= 2; c.font = `${size}px Georgia`; } c.fillText(name, 600, 445);
    c.fillStyle = '#eadfd0'; c.beginPath(); c.ellipse(600, 1030, 287, 35, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e39bb0'; c.fillRect(380, 785, 440, 230); c.beginPath(); c.ellipse(600, 1015, 220, 30, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffeadf'; c.beginPath(); c.ellipse(600, 785, 220, 60, 0, 0, Math.PI * 2); c.fill();
    ['#e9a4b2','#e8bf64','#afb99b'].forEach((color, i) => { const x = 510 + i * 80; c.fillStyle = color; c.fillRect(x, 652, 20, 132); c.fillStyle = '#edb24c'; c.beginPath(); c.ellipse(x + 10, 621, 11, 24, .1, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = '#bb536e'; c.font = '72px Georgia'; c.fillText('♡', 600, 910); c.fillStyle = '#897a70'; c.font = '31px Georgia';
    c.fillText(language === 'id' ? 'Semoga usia barumu penuh warna,' : 'Here’s to a colorful new chapter,', 600, 1185);
    c.fillText(language === 'id' ? 'kedamaian, dan tawa.' : 'a little more peace, and a lot more laughter.', 600, 1240);
    c.font = '27px Georgia'; c.fillStyle = '#bb536e'; const signature = (language === 'id' ? 'Dengan cinta, ' : 'With love, ') + (config.sender || t().me) + ' ♡';
    let signatureSize = 27; while (c.measureText(signature).width > 1000 && signatureSize > 12) { signatureSize--; c.font = `${signatureSize}px Georgia`; } c.fillText(signature, 600, 1380);
    card.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'a-little-birthday-magic.png'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); showToast(t().saved); }, 'image/png');
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('shown'); observer.unobserve(entry.target); } }), { threshold: .12 });
    $$('.reveal').forEach((element) => observer.observe(element));
  } else $$('.reveal').forEach((element) => element.classList.add('shown'));
  window.BirthdayExperience = { language: () => language, progress: () => [...found] };
  renderLanguage();
  if (musicWanted) { enableMusicFallback(); startMusic(true); }
})();
