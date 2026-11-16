(() => {
  'use strict';

  const screens = {
    welcome: document.getElementById('welcome-screen'),
    game: document.getElementById('game-screen'),
    final: document.getElementById('final-screen')
  };
  const gameTitle = document.getElementById('game-title');
  const gameSubtitle = document.getElementById('game-subtitle');
  const stageEyebrow = document.getElementById('stage-eyebrow');
  const memoryToolbar = document.getElementById('memory-toolbar');
  const memoryGrid = document.getElementById('memory-grid');
  const catchToolbar = document.getElementById('catch-toolbar');
  const catchArea = document.getElementById('catch-area');
  const catchBasket = document.getElementById('catch-basket');
  const catchOverlay = document.getElementById('catch-overlay');
  const giftArea = document.getElementById('gift-area');
  const gameResult = document.getElementById('game-result');
  const nextButton = document.getElementById('next-button');
  const progressDots = [...document.querySelectorAll('.progress-dot')];
  const symbols = ['🐻', '🌷', '🦋', '🍓', '🌙', '🐝'];
  const giftMessages = [
    'A little reminder: your smile makes the world softer and brighter. Keep being wonderfully you! 🌷',
    'Your heart is full of lovely things. May happy little moments find you everywhere! 🦋',
    'You are braver, kinder, and more magical than you know. The world is lucky to have you! 🌟'
  ];
  const catchReadyMarkup = '<div class="overlay-emoji">💞</div><h2>Ready, little heart-catcher?</h2><p>Move your basket to catch as many hearts as you can in 20 seconds!</p><button class="button button-primary" id="catch-start">Start catching! <span>💗</span></button>';

  let stage = 0;
  let completed = [false, false, false];
  let flipped = [];
  let matchedPairs = 0;
  let moves = 0;
  let locked = false;
  let chosenGift = false;
  let catchState = null;
  let catchX = 0.5;
  let muted = false;
  let audioContext = null;
  let toastTimer;

  function showScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => {
      screen.classList.toggle('is-hidden', key !== name);
    });
  }

  function updateProgress() {
    progressDots.forEach((dot, index) => {
      dot.classList.toggle('is-done', completed[index]);
      dot.setAttribute('aria-label', `Game ${index + 1}${completed[index] ? ' completed' : ''}`);
    });
  }

  function startAdventure() {
    stage = 0;
    showScreen('game');
    renderStage();
  }

  function renderStage() {
    stopCatchGame();
    gameResult.classList.add('is-hidden');
    gameResult.textContent = '';
    nextButton.classList.add('is-hidden');
    memoryGrid.classList.add('is-hidden');
    memoryToolbar.classList.add('is-hidden');
    catchToolbar.classList.add('is-hidden');
    catchArea.classList.add('is-hidden');
    giftArea.classList.add('is-hidden');

    stageEyebrow.textContent = `GAME ${stage + 1} OF 3`;
    if (stage === 0) {
      gameTitle.textContent = 'Memory Match';
      gameSubtitle.textContent = 'Find the matching little friends!';
      memoryGrid.classList.remove('is-hidden');
      memoryToolbar.classList.remove('is-hidden');
      createMemoryCards();
    } else if (stage === 1) {
      gameTitle.textContent = 'Catch the Hearts';
      gameSubtitle.textContent = 'A little basket, a sky full of love!';
      catchToolbar.classList.remove('is-hidden');
      catchArea.classList.remove('is-hidden');
      document.getElementById('catch-score').textContent = '0';
      document.getElementById('catch-timer').textContent = '20';
      catchBasket.style.left = '50%';
      catchOverlay.innerHTML = catchReadyMarkup;
      catchOverlay.classList.remove('is-hidden');
    } else {
      gameTitle.textContent = 'Choose Your Mystery Gift';
      gameSubtitle.textContent = 'There’s a little lovely thing inside each one!';
      giftArea.classList.remove('is-hidden');
      chosenGift = false;
      document.getElementById('gift-reveal').classList.add('is-hidden');
      document.querySelectorAll('.gift-box').forEach(box => {
        box.disabled = false;
        box.classList.remove('is-chosen');
      });
    }
    updateProgress();
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function createMemoryCards() {
    moves = 0;
    matchedPairs = 0;
    flipped = [];
    locked = false;
    document.getElementById('move-count').textContent = '0';
    document.getElementById('pair-count').textContent = '0 / 6';
    memoryGrid.replaceChildren();

    shuffle([...symbols, ...symbols]).forEach((symbol, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'memory-card';
      card.dataset.symbol = symbol;
      card.setAttribute('aria-label', `Hidden card ${index + 1}`);
      card.setAttribute('aria-pressed', 'false');
      const face = document.createElement('span');
      face.className = 'card-face';
      face.textContent = symbol;
      face.setAttribute('aria-hidden', 'true');
      card.append(face);
      card.addEventListener('click', () => flipCard(card));
      memoryGrid.append(card);
    });
  }

  function flipCard(card) {
    if (locked || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
    card.classList.add('is-flipped');
    card.setAttribute('aria-pressed', 'true');
    card.setAttribute('aria-label', `Revealed ${card.dataset.symbol}`);
    flipped.push(card);

    if (flipped.length !== 2) return;
    moves++;
    document.getElementById('move-count').textContent = String(moves);
    const [first, second] = flipped;
    if (first.dataset.symbol === second.dataset.symbol) {
      first.classList.add('is-matched');
      second.classList.add('is-matched');
      first.setAttribute('aria-label', `Matched ${first.dataset.symbol}`);
      second.setAttribute('aria-label', `Matched ${second.dataset.symbol}`);
      flipped = [];
      matchedPairs++;
      document.getElementById('pair-count').textContent = `${matchedPairs} / 6`;
      if (matchedPairs === symbols.length) completeStage('You found every little friend! That was wonderful! ✨');
    } else {
      locked = true;
      window.setTimeout(() => {
        [first, second].forEach(item => {
          item.classList.remove('is-flipped');
          item.setAttribute('aria-pressed', 'false');
          item.setAttribute('aria-label', 'Hidden card');
        });
        flipped = [];
        locked = false;
      }, 850);
    }
  }

  function completeStage(message) {
    if (completed[stage]) return;
    completed[stage] = true;
    updateProgress();
    gameResult.textContent = message;
    gameResult.classList.remove('is-hidden');
    nextButton.classList.remove('is-hidden');
    nextButton.innerHTML = stage === 2 ? 'See your surprise <span>♡</span>' : 'Next little adventure <span>→</span>';
  }

  function nextStage() {
    if (!completed[stage]) return;
    if (stage === 2) {
      showFinalScreen();
      return;
    }
    stage++;
    renderStage();
    document.querySelector('.game-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setBasket(clientX) {
    const rect = catchArea.getBoundingClientRect();
    catchX = Math.max(.06, Math.min(.94, (clientX - rect.left) / rect.width));
    catchBasket.style.left = `${catchX * 100}%`;
  }

  function playPop() {
    if (muted) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = audioContext || new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(990, audioContext.currentTime + .09);
      gain.gain.setValueAtTime(.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .12);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + .13);
    } catch (error) {
      showToast('Sound is unavailable in this browser.');
    }
  }

  function startCatchGame() {
    if (catchState) return;
    catchOverlay.classList.add('is-hidden');
    const startTime = performance.now();
    catchState = {
      startTime,
      lastFrame: startTime,
      lastSpawn: startTime,
      hearts: [],
      score: 0,
      frame: 0
    };
    document.getElementById('catch-score').textContent = '0';
    document.getElementById('catch-timer').textContent = '20';
    catchArea.focus({ preventScroll: true });
    catchState.frame = requestAnimationFrame(updateCatchGame);
  }

  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'falling-heart';
    heart.textContent = Math.random() > .5 ? '💗' : '💖';
    const x = .08 + Math.random() * .84;
    heart.style.left = `${x * 100}%`;
    catchArea.append(heart);
    catchState.hearts.push({ element: heart, x, y: -25, speed: 105 + Math.random() * 85 });
  }

  function updateCatchGame(now) {
    if (!catchState) return;
    const remaining = Math.max(0, 20 - (now - catchState.startTime) / 1000);
    document.getElementById('catch-timer').textContent = String(Math.ceil(remaining));
    if (now - catchState.lastSpawn >= 520) {
      spawnHeart();
      catchState.lastSpawn = now;
    }

    const height = catchArea.clientHeight;
    const basketY = height - 58;
    const catchRadius = .105;
    const delta = Math.min((now - catchState.lastFrame) / 1000, .05);
    catchState.lastFrame = now;
    catchState.hearts = catchState.hearts.filter(heart => {
      heart.y += heart.speed * delta;
      heart.element.style.top = `${heart.y}px`;
      if (heart.y >= basketY - 5 && heart.y <= basketY + 36 && Math.abs(heart.x - catchX) < catchRadius) {
        heart.element.remove();
        catchState.score++;
        document.getElementById('catch-score').textContent = String(catchState.score);
        playPop();
        return false;
      }
      if (heart.y > height + 30) {
        heart.element.remove();
        return false;
      }
      return true;
    });

    if (remaining <= 0) {
      const score = catchState.score;
      stopCatchGame();
      catchOverlay.innerHTML = `<div class="overlay-emoji">✨</div><h2>So many hearts, so much love!</h2><p>You caught <strong>${score}</strong> ${score === 1 ? 'heart' : 'hearts'}! Your basket is full of sparkle.</p>`;
      catchOverlay.classList.remove('is-hidden');
      completeStage(`You caught ${score} ${score === 1 ? 'sweet heart' : 'sweet hearts'}! You’re a heart-catching star! 💗`);
      return;
    }
    catchState.frame = requestAnimationFrame(updateCatchGame);
  }

  function stopCatchGame() {
    if (!catchState) return;
    cancelAnimationFrame(catchState.frame);
    catchState.hearts.forEach(heart => heart.element.remove());
    catchState = null;
  }

  function chooseGift(event) {
    const box = event.target.closest('.gift-box');
    if (!box || chosenGift) return;
    chosenGift = true;
    document.querySelectorAll('.gift-box').forEach(item => {
      item.disabled = true;
      item.classList.toggle('is-chosen', item === box);
    });
    const reveal = document.getElementById('gift-reveal');
    reveal.textContent = giftMessages[Number(box.dataset.gift)];
    reveal.classList.remove('is-hidden');
    completeStage('A little gift, picked just for you! 🎀');
  }

  function showFinalScreen() {
    showScreen('final');
    const confetti = document.querySelector('.final-confetti');
    confetti.replaceChildren();
    const colors = ['#f69ab7', '#c7a8ef', '#a8d7f0', '#f8cf82', '#aed9b7'];
    for (let i = 0; i < 42; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[i % colors.length];
      piece.style.animationDelay = `${Math.random() * 3}s`;
      piece.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
      confetti.append(piece);
    }
    updateProgress();
  }

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  document.getElementById('start-button').addEventListener('click', startAdventure);
  nextButton.addEventListener('click', nextStage);
  catchOverlay.addEventListener('click', event => {
    if (event.target.closest('#catch-start')) startCatchGame();
  });
  document.getElementById('sound-button').addEventListener('click', event => {
    muted = !muted;
    event.currentTarget.setAttribute('aria-pressed', String(muted));
    event.currentTarget.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
    event.currentTarget.textContent = muted ? '🔇 Sound off' : '🔊 Sound on';
  });
  catchArea.addEventListener('pointermove', event => {
    if (catchState && event.pointerType !== 'touch') setBasket(event.clientX);
  });
  catchArea.addEventListener('pointerdown', event => {
    if (catchState) setBasket(event.clientX);
  });
  catchArea.addEventListener('keydown', event => {
    if (!catchState || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const step = event.key === 'ArrowLeft' ? -.055 : .055;
    const rect = catchArea.getBoundingClientRect();
    setBasket(rect.left + Math.max(.06, Math.min(.94, catchX + step)) * rect.width);
  });
  giftArea.addEventListener('click', chooseGift);
  document.getElementById('replay-button').addEventListener('click', () => {
    stopCatchGame();
    completed = [false, false, false];
    updateProgress();
    showScreen('welcome');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
