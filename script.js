const menuButton = document.querySelector('.menu-button');
const nav = document.querySelector('#site-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.textContent = open ? 'Menu' : 'Close';
  nav.classList.toggle('open', !open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu';
  nav.classList.remove('open');
}));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const formatTime = seconds => {
  if (!Number.isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const players = [...document.querySelectorAll('[data-audio-player]')];
players.forEach(player => {
  const audio = player.querySelector('audio');
  const playButton = player.querySelector('[data-play]');
  const seek = player.querySelector('[data-seek]');
  const current = player.querySelector('[data-current]');
  const duration = player.querySelector('[data-duration]');
  const title = player.dataset.title;

  const paintProgress = value => {
    seek.style.setProperty('--progress', `${value}%`);
  };

  playButton.addEventListener('click', () => {
    if (audio.paused) {
      players.forEach(other => {
        const otherAudio = other.querySelector('audio');
        if (otherAudio !== audio) otherAudio.pause();
      });
      audio.play();
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    duration.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('play', () => {
    playButton.classList.add('playing');
    playButton.setAttribute('aria-label', `Pause ${title}`);
  });
  audio.addEventListener('pause', () => {
    playButton.classList.remove('playing');
    playButton.setAttribute('aria-label', `Play ${title}`);
  });
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    seek.value = progress;
    current.textContent = formatTime(audio.currentTime);
    paintProgress(progress);
  });
  audio.addEventListener('ended', () => {
    seek.value = 0;
    current.textContent = '00:00';
    paintProgress(0);
  });

  seek.addEventListener('input', () => {
    const progress = Number(seek.value);
    if (audio.duration) {
      audio.currentTime = (progress / 100) * audio.duration;
      current.textContent = formatTime(audio.currentTime);
    }
    paintProgress(progress);
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();
