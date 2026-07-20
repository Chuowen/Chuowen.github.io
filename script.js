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

const audio = document.querySelector('#audio-player');
const playButton = document.querySelector('.play-button');
const time = document.querySelector('#audio-time');
playButton.addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
audio.addEventListener('play', () => { playButton.classList.add('playing'); playButton.setAttribute('aria-label', 'Pause DSPoem'); });
audio.addEventListener('pause', () => { playButton.classList.remove('playing'); playButton.setAttribute('aria-label', 'Play DSPoem'); });
audio.addEventListener('timeupdate', () => {
  const mins = Math.floor(audio.currentTime / 60).toString().padStart(2, '0');
  const secs = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
  time.textContent = `${mins}:${secs}`;
});

document.querySelector('#year').textContent = new Date().getFullYear();
