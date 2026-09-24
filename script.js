const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const counters = document.querySelectorAll('[data-count]');
const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const counter = entry.target;
      const target = Number(counter.dataset.count);
      const duration = 1200;
      const stepTime = Math.max(20, Math.floor(duration / target));
      let current = 0;

      const timer = setInterval(() => {
        current += 1;
        counter.textContent = current;

        if (current >= target) {
          clearInterval(timer);
          counter.textContent = target + (target === 100 ? '%' : '+');
        }
      }, stepTime);

      counterObserver.unobserve(counter);
    });
  },
  { threshold: 0.5 }
);

counters.forEach((counter) => counterObserver.observe(counter));

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  const trigger = item.querySelector('.faq-question');

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('active');

    faqItems.forEach((faq) => {
      faq.classList.remove('active');
    });

    if (!isOpen) {
      item.classList.add('active');
    }
  });
});

const yearNode = document.getElementById('year');
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

/* =========================================================
   SISTEM ANIMASI PROFIL: PROXIMITY, LOCK KURSOR & GELEMBUNG
   ========================================================= */
function initProfileInteractions() {
  const showcaseCard = document.querySelector('.showcase-card');
  const profileRow = document.querySelector('.profile-row');
  const avatarWrap = document.querySelector('.avatar-wrap');
  if (!profileRow || !avatarWrap) return;

  const avatarImg = avatarWrap.querySelector('img');
  const avatarGlow = avatarWrap.querySelector('.avatar-glow-ring');

  // 1. Buat elemen Lock Cursor HUD
  const lockCursor = document.createElement('div');
  lockCursor.id = 'profile-lock-cursor';
  lockCursor.className = 'profile-lock-cursor';
  lockCursor.setAttribute('aria-hidden', 'true');
  lockCursor.innerHTML = `
    <div class="lock-bracket bracket-tl"></div>
    <div class="lock-bracket bracket-tr"></div>
    <div class="lock-bracket bracket-bl"></div>
    <div class="lock-bracket bracket-br"></div>
    <div class="lock-ring-outer"></div>
    <div class="lock-ring-dashed"></div>
    <div class="lock-ring-inner"></div>
    <div class="lock-crosshair-h"></div>
    <div class="lock-crosshair-v"></div>
    <div class="lock-center-dot"></div>
    <div class="lock-shockwave"></div>
    <div class="lock-data">
      <span class="lock-tag">TARGET LOCK</span>
      <span class="lock-coord">FA-01</span>
    </div>
  `;
  document.body.appendChild(lockCursor);

  // 2. Buat container gelembung klik / ledakan
  const bubbleContainer = document.createElement('div');
  bubbleContainer.className = 'profile-bubbles-container';
  bubbleContainer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bubbleContainer);

  // 3. Buat gelembung ambient yang melayang dan bergerak saat kursor mendekat
  const ambientWrap = document.createElement('div');
  ambientWrap.className = 'ambient-bubbles-wrap';
  ambientWrap.setAttribute('aria-hidden', 'true');
  profileRow.appendChild(ambientWrap);

  const ambientBubblesData = [
    { baseLeft: -12, baseTop: -14, size: 28, idleSpeed: 0.0022, idleAmp: 7, phase: 0 },
    { baseLeft: 98, baseTop: -18, size: 22, idleSpeed: 0.0018, idleAmp: 6, phase: 1.8 },
    { baseLeft: 116, baseTop: 74, size: 30, idleSpeed: 0.0024, idleAmp: 8, phase: 3.2 },
    { baseLeft: -16, baseTop: 82, size: 20, idleSpeed: 0.002, idleAmp: 5, phase: 4.5 }
  ];

  const ambientBubbles = ambientBubblesData.map((data) => {
    const el = document.createElement('div');
    el.className = 'ambient-bubble';
    el.style.width = `${data.size}px`;
    el.style.height = `${data.size}px`;
    el.style.left = `${data.baseLeft}px`;
    el.style.top = `${data.baseTop}px`;
    ambientWrap.appendChild(el);

    // Klik pada gelembung ambient untuk meletuskannya
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      el.classList.add('popping');
      createPopSparkles(e.clientX, e.clientY);
      spawnBubbleBurst(e.clientX, e.clientY, 6);
      setTimeout(() => {
        el.classList.remove('popping');
        el.style.opacity = '0';
        setTimeout(() => {
          el.style.opacity = '1';
        }, 1200);
      }, 350);
    });

    return {
      el,
      ...data,
      currX: 0,
      currY: 0,
      targetRepelX: 0,
      targetRepelY: 0,
      scaleX: 1,
      scaleY: 1
    };
  });

  const tagEl = lockCursor.querySelector('.lock-tag');
  const coordEl = lockCursor.querySelector('.lock-coord');

  let mouseX = -500;
  let mouseY = -500;
  let currentLockX = -500;
  let currentLockY = -500;

  let targetAvatarX = 0;
  let targetAvatarY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentAvatarX = 0;
  let currentAvatarY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  let targetCardTiltX = 0;
  let targetCardTiltY = 0;
  let currentCardTiltX = 0;
  let currentCardTiltY = 0;

  let currentGlowOpacity = 0.2;
  let targetGlowOpacity = 0.2;

  let isLockActive = false;
  let lastMoveX = 0;
  let lastMoveY = 0;
  let moveDistance = 0;

  // Render & Physics Loop (60-120fps)
  function renderLoop(time) {
    // 1. Animasi Avatar Magnetik (Bebas dari clipping 3D / garis hitam)
    currentAvatarX += (targetAvatarX - currentAvatarX) * 0.16;
    currentAvatarY += (targetAvatarY - currentAvatarY) * 0.16;
    currentGlowOpacity += (targetGlowOpacity - currentGlowOpacity) * 0.15;

    avatarWrap.style.transform = `translate3d(${currentAvatarX}px, ${currentAvatarY}px, 0)`;
    if (avatarImg) {
      avatarImg.style.transform = `scale(1.08) translate3d(${-currentAvatarX * 0.45}px, ${-currentAvatarY * 0.45}px, 0)`;
    }
    if (avatarGlow) {
      avatarGlow.style.opacity = currentGlowOpacity;
      avatarGlow.style.boxShadow = `inset 0 0 18px rgba(115, 214, 255, 0.4), 0 0 ${14 + currentGlowOpacity * 24}px rgba(115, 214, 255, ${currentGlowOpacity * 0.6})`;
    }

    // 2. Animasi Showcase Card Tilt Halus
    if (showcaseCard) {
      currentCardTiltX += (targetCardTiltX - currentCardTiltX) * 0.12;
      currentCardTiltY += (targetCardTiltY - currentCardTiltY) * 0.12;
      showcaseCard.style.transform = `rotateX(${currentCardTiltX}deg) rotateY(${currentCardTiltY}deg)`;
    }

    // 3. Animasi Gelembung Ambient (Melayang santai + menghindar saat kursor mendekat)
    ambientBubbles.forEach((b) => {
      const idleFloatY = Math.sin(time * b.idleSpeed + b.phase) * b.idleAmp;
      const idleFloatX = Math.cos(time * b.idleSpeed * 0.7 + b.phase) * (b.idleAmp * 0.6);

      b.currX += (b.targetRepelX - b.currX) * 0.14;
      b.currY += (b.targetRepelY - b.currY) * 0.14;

      const totalX = idleFloatX + b.currX;
      const totalY = idleFloatY + b.currY;

      b.el.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) scale(${b.scaleX}, ${b.scaleY})`;
    });

    // 4. Animasi Lock Cursor HUD
    if (isLockActive) {
      currentLockX += (mouseX - currentLockX) * 0.28;
      currentLockY += (mouseY - currentLockY) * 0.28;
      lockCursor.style.transform = `translate3d(${currentLockX}px, ${currentLockY}px, 0) translate(-50%, -50%)`;
    }

    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

  // Listener Pergerakan Kursor untuk Proximity Detection
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const avatarRect = avatarWrap.getBoundingClientRect();
    const avatarCenterX = avatarRect.left + avatarRect.width / 2;
    const avatarCenterY = avatarRect.top + avatarRect.height / 2;
    const distAvatar = Math.hypot(e.clientX - avatarCenterX, e.clientY - avatarCenterY);

    const profileRect = profileRow.getBoundingClientRect();
    const inProfileX = e.clientX >= profileRect.left - 40 && e.clientX <= profileRect.right + 40;
    const inProfileY = e.clientY >= profileRect.top - 40 && e.clientY <= profileRect.bottom + 40;
    const isNearProfile = inProfileX && inProfileY;

    // --- PROXIMITY AVATAR: Bergerak saat kursor mendekat (< 320px) ---
    const maxAvatarRange = 320;
    if (distAvatar < maxAvatarRange) {
      const factor = Math.pow(1 - distAvatar / maxAvatarRange, 1.4);
      const normX = (e.clientX - avatarCenterX) / maxAvatarRange;
      const normY = (e.clientY - avatarCenterY) / maxAvatarRange;

      targetAvatarX = normX * 18 * factor;
      targetAvatarY = normY * 18 * factor;
      targetTiltX = -normY * 22 * factor;
      targetTiltY = normX * 22 * factor;
      targetGlowOpacity = 0.25 + factor * 0.75;
    } else {
      targetAvatarX = 0;
      targetAvatarY = 0;
      targetTiltX = 0;
      targetTiltY = 0;
      targetGlowOpacity = 0.2;
    }

    // --- PROXIMITY SHOWCASE CARD: Tilt 3D saat kursor mendekat ---
    if (showcaseCard) {
      const cardRect = showcaseCard.getBoundingClientRect();
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      const distCard = Math.hypot(e.clientX - cardCenterX, e.clientY - cardCenterY);

      if (distCard < 420) {
        const factorCard = 1 - distCard / 420;
        targetCardTiltX = -((e.clientY - cardCenterY) / 420) * 6 * factorCard;
        targetCardTiltY = ((e.clientX - cardCenterX) / 420) * 8 * factorCard;
      } else {
        targetCardTiltX = 0;
        targetCardTiltY = 0;
      }
    }

    // --- PROXIMITY GELEMBUNG AMBIENT: Menghindar & bereaksi saat kursor mendekat (< 110px) ---
    ambientBubbles.forEach((b) => {
      const bRect = b.el.getBoundingClientRect();
      const bCenterX = bRect.left + bRect.width / 2;
      const bCenterY = bRect.top + bRect.height / 2;
      const distBubble = Math.hypot(e.clientX - bCenterX, e.clientY - bCenterY);

      if (distBubble < 110) {
        const repelForce = (1 - distBubble / 110) * 38;
        const angle = Math.atan2(bCenterY - e.clientY, bCenterX - e.clientX);
        b.targetRepelX = Math.cos(angle) * repelForce;
        b.targetRepelY = Math.sin(angle) * repelForce;
        b.scaleX = 1 + (1 - distBubble / 110) * 0.18;
        b.scaleY = 1 - (1 - distBubble / 110) * 0.12;
      } else {
        b.targetRepelX = 0;
        b.targetRepelY = 0;
        b.scaleX = 1;
        b.scaleY = 1;
      }
    });

    // --- LOCK CURSOR: Aktif di area profil & mengunci avatar ---
    if (isNearProfile) {
      if (!isLockActive) {
        isLockActive = true;
        currentLockX = e.clientX;
        currentLockY = e.clientY;
        lockCursor.classList.add('is-active');
      }

      // Cek apakah kursor tepat berada di atas foto avatar
      const isOverAvatar = e.target === avatarWrap || avatarWrap.contains(e.target);
      if (isOverAvatar) {
        lockCursor.classList.add('is-locked');
        if (tagEl) tagEl.textContent = 'LOCKED 100%';
        if (coordEl) coordEl.textContent = 'AVATAR';
      } else {
        lockCursor.classList.remove('is-locked');
        if (tagEl) tagEl.textContent = 'TARGET LOCK';
        if (coordEl) coordEl.textContent = 'PROFILE';
      }

      // Deteksi gesekan kursor (friction micro-bubbles)
      const moveDist = Math.hypot(e.clientX - lastMoveX, e.clientY - lastMoveY);
      moveDistance += moveDist;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;

      if (moveDistance > 45) {
        moveDistance = 0;
        spawnMicroBubble(e.clientX, e.clientY);
      }
    } else {
      if (isLockActive) {
        isLockActive = false;
        lockCursor.classList.remove('is-active', 'is-locked', 'is-clicking');
      }
    }
  });

  // Fungsi Buat Gelembung Kecil saat kursor digesekkan
  function spawnMicroBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble-entity micro-bubble';
    const size = Math.floor(Math.random() * 12) + 12;
    const driftX = (Math.random() - 0.5) * 36;
    const floatY = Math.random() * 45 + 35;
    const duration = (Math.random() * 0.4 + 0.75).toFixed(2);

    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.setProperty('--start-x', `${x - size / 2}px`);
    bubble.style.setProperty('--start-y', `${y - size / 2}px`);
    bubble.style.setProperty('--drift-x', `${driftX}px`);
    bubble.style.setProperty('--float-y', `${floatY}px`);
    bubble.style.setProperty('--duration', `${duration}s`);

    bubbleContainer.appendChild(bubble);
    setTimeout(() => bubble.remove(), duration * 1000);
  }

  // Fungsi Ledakan Gelembung saat Profil Diklik
  function spawnBubbleBurst(x, y, customCount) {
    const count = customCount || (Math.floor(Math.random() * 5) + 10);

    // Animasi membal avatar
    if (avatarWrap) {
      avatarWrap.classList.add('avatar-bounce');
      setTimeout(() => avatarWrap.classList.remove('avatar-bounce'), 140);
    }

    // Shockwave reticle
    if (isLockActive) {
      lockCursor.classList.add('is-clicking');
      setTimeout(() => lockCursor.classList.remove('is-clicking'), 450);
    }

    for (let i = 0; i < count; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble-entity';

      const size = Math.floor(Math.random() * 32) + 16;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const spread = Math.random() * 55 + 20;
      const driftX = Math.cos(angle) * spread;
      const floatY = Math.abs(Math.sin(angle) * spread) + Math.random() * 95 + 75;
      const duration = (Math.random() * 0.5 + 0.95).toFixed(2);
      const delay = Math.random() * 0.08;

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.setProperty('--start-x', `${x - size / 2}px`);
      bubble.style.setProperty('--start-y', `${y - size / 2}px`);
      bubble.style.setProperty('--drift-x', `${driftX}px`);
      bubble.style.setProperty('--float-y', `${floatY}px`);
      bubble.style.setProperty('--duration', `${duration}s`);
      bubble.style.animationDelay = `${delay}s`;

      bubbleContainer.appendChild(bubble);

      setTimeout(() => {
        createPopSparkles(x + driftX, y - floatY);
        bubble.remove();
      }, (Number(duration) + delay) * 1000);
    }
  }

  // Partikel percikan saat gelembung meletus (pop)
  function createPopSparkles(x, y) {
    for (let i = 0; i < 4; i++) {
      const spark = document.createElement('div');
      spark.className = 'bubble-sparkle';
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 24 + 10;
      const sx = Math.cos(angle) * speed;
      const sy = Math.sin(angle) * speed;

      spark.style.setProperty('--x', `${x}px`);
      spark.style.setProperty('--y', `${y}px`);
      spark.style.setProperty('--sx', `${sx}px`);
      spark.style.setProperty('--sy', `${sy}px`);

      bubbleContainer.appendChild(spark);
      setTimeout(() => spark.remove(), 550);
    }
  }

  // Klik Profil untuk meletuskan gelembung
  profileRow.addEventListener('click', (e) => {
    spawnBubbleBurst(e.clientX, e.clientY);
  });

  // Touch Support untuk Mobile
  profileRow.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
      currentLockX = touch.clientX;
      currentLockY = touch.clientY;
      isLockActive = true;
      lockCursor.classList.add('is-active');
      spawnBubbleBurst(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  profileRow.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      mouseX = touch.clientX;
      mouseY = touch.clientY;
      spawnMicroBubble(touch.clientX, touch.clientY);
    }
  }, { passive: true });

  profileRow.addEventListener('touchend', () => {
    setTimeout(() => {
      isLockActive = false;
      lockCursor.classList.remove('is-active', 'is-locked', 'is-clicking');
    }, 600);
  });
}

/* =========================================================
   SISTEM PEMUTAR MUSIK LO-FI (ANIMASI & INTERAKTIF PENUH)
   ========================================================= */
function initMusicPlayer() {
  const playerPanel = document.getElementById('music-player');
  const btnPlay = document.getElementById('btn-play');
  const playIcon = document.getElementById('play-icon');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const musicCover = document.getElementById('music-cover');
  const songTitle = document.getElementById('song-title');
  const songArtist = document.getElementById('song-artist');
  const songIcon = document.getElementById('song-icon');
  const trackNumber = document.getElementById('track-number');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const progressFill = document.getElementById('progress-fill');
  const progressThumb = document.getElementById('progress-thumb');
  const progressBar = document.getElementById('music-progress-bar');
  const badgePlaying = document.getElementById('badge-playing');

  if (!playerPanel || !btnPlay) return;

  const playlist = [
    {
      title: 'Multo',
      artist: 'Cup of Joe • OPM Indie',
      icon: '🌙',
      duration: 214, // 3:34
      badge: 'OPM INDIE 🌙'
    },
    {
      title: 'Coffee Day',
      artist: 'Cup of Joe • Acoustic Sessions',
      icon: '☕',
      duration: 195, // 3:15
      badge: 'ACOUSTIC VIBES ☕'
    },
    {
      title: 'Runway',
      artist: 'Cup of Joe • Blossom',
      icon: '✈️',
      duration: 228, // 3:48
      badge: 'CHILL INDIE ✈️'
    }
  ];

  let currentTrackIdx = 0;
  let isPlaying = false;
  let currentTime = 0;
  let playInterval = null;
  let noteSpawnTimer = null;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function updateTrackDisplay() {
    const track = playlist[currentTrackIdx];
    if (songTitle) songTitle.textContent = track.title;
    if (songArtist) songArtist.textContent = track.artist;
    if (songIcon) songIcon.textContent = track.icon;
    if (trackNumber) trackNumber.textContent = `${currentTrackIdx + 1}/${playlist.length}`;
    if (timeTotal) timeTotal.textContent = formatTime(track.duration);
    if (badgePlaying) badgePlaying.textContent = track.badge;
    updateProgressUI();
  }

  function updateProgressUI() {
    const track = playlist[currentTrackIdx];
    const percent = Math.min(100, (currentTime / track.duration) * 100);
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressThumb) progressThumb.style.left = `${percent}%`;
    if (timeCurrent) timeCurrent.textContent = formatTime(currentTime);
  }

  function togglePlay() {
    isPlaying = !isPlaying;
    if (isPlaying) {
      startPlayback();
    } else {
      pausePlayback();
    }
  }

  function startPlayback() {
    isPlaying = true;
    playerPanel.classList.add('is-playing');
    btnPlay.classList.add('is-playing-btn');
    if (playIcon) playIcon.textContent = '❚❚';

    clearInterval(playInterval);
    playInterval = setInterval(() => {
      const track = playlist[currentTrackIdx];
      currentTime += 0.5;
      if (currentTime >= track.duration) {
        nextTrack();
      } else {
        updateProgressUI();
      }
    }, 500);

    // Efek partikel not musik melayang
    clearInterval(noteSpawnTimer);
    noteSpawnTimer = setInterval(() => {
      if (isPlaying) spawnFloatingNote();
    }, 1300);
    spawnFloatingNote();
  }

  function pausePlayback() {
    isPlaying = false;
    playerPanel.classList.remove('is-playing');
    btnPlay.classList.remove('is-playing-btn');
    if (playIcon) playIcon.textContent = '▶';
    clearInterval(playInterval);
    clearInterval(noteSpawnTimer);
  }

  function nextTrack() {
    currentTrackIdx = (currentTrackIdx + 1) % playlist.length;
    currentTime = 0;
    updateTrackDisplay();
    if (isPlaying) startPlayback();
  }

  function prevTrack() {
    if (currentTime > 3) {
      currentTime = 0;
      updateProgressUI();
    } else {
      currentTrackIdx = (currentTrackIdx - 1 + playlist.length) % playlist.length;
      currentTime = 0;
      updateTrackDisplay();
    }
    if (isPlaying) startPlayback();
  }

  // Seek bar saat progress bar diklik
  if (progressBar) {
    progressBar.addEventListener('click', (e) => {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const track = playlist[currentTrackIdx];
      currentTime = ratio * track.duration;
      updateProgressUI();
    });
  }

  // Partikel not balok melayang
  function spawnFloatingNote() {
    const notes = ['♪', '♫', '♬', '♩', '✨'];
    const noteEl = document.createElement('div');
    noteEl.className = 'floating-music-note';
    noteEl.textContent = notes[Math.floor(Math.random() * notes.length)];

    const coverRect = musicCover ? musicCover.getBoundingClientRect() : playerPanel.getBoundingClientRect();
    const panelRect = playerPanel.getBoundingClientRect();

    const startX = coverRect.left - panelRect.left + coverRect.width / 2 + (Math.random() - 0.5) * 16;
    const startY = coverRect.top - panelRect.top + 8;
    const driftX = (Math.random() - 0.5) * 44;
    const rot = (Math.random() - 0.5) * 40;

    noteEl.style.setProperty('--nx', `${startX}px`);
    noteEl.style.setProperty('--ny', `${startY}px`);
    noteEl.style.setProperty('--driftX', `${driftX}px`);
    noteEl.style.setProperty('--rot', `${rot}deg`);

    playerPanel.appendChild(noteEl);
    setTimeout(() => noteEl.remove(), 1900);
  }

  btnPlay.addEventListener('click', togglePlay);
  if (musicCover) musicCover.addEventListener('click', togglePlay);
  if (btnNext) btnNext.addEventListener('click', nextTrack);
  if (btnPrev) btnPrev.addEventListener('click', prevTrack);

  updateTrackDisplay();
}

// Inisialisasi setelah dokumen siap
function initAll() {
  initProfileInteractions();
  initMusicPlayer();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}
