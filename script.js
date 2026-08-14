const menu_button = document.querySelector('.menu-button');
const site_nav = document.querySelector('#site-nav');

function closeMenu() {
  if (!menu_button || !site_nav) return;
  menu_button.setAttribute('aria-expanded', 'false');
  menu_button.querySelector('span').textContent = 'Menu';
  site_nav.classList.remove('open');
}

menu_button?.addEventListener('click', () => {
  const is_open = menu_button.getAttribute('aria-expanded') === 'true';
  menu_button.setAttribute('aria-expanded', String(!is_open));
  menu_button.querySelector('span').textContent = is_open ? 'Menu' : 'Close';
  site_nav.classList.toggle('open', !is_open);
});
site_nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});

const reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduced_motion.matches) {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
} else {
  const reveal_observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      reveal_observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => reveal_observer.observe(element));
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '--:--';
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

const audio_players = [...document.querySelectorAll('[data-audio-player]')];
audio_players.forEach(player => {
  const audio = player.querySelector('audio');
  const play_button = player.querySelector('[data-play]');
  const symbol = player.querySelector('[data-play-symbol]');
  const seek = player.querySelector('[data-seek]');
  const current = player.querySelector('[data-current]');
  const duration = player.querySelector('[data-duration]');
  const title = player.dataset.title;

  function updateButton(is_playing) {
    play_button.classList.toggle('playing', is_playing);
    play_button.setAttribute('aria-label', `${is_playing ? 'Pause' : 'Play'} ${title}`);
    symbol.textContent = is_playing ? 'Ⅱ' : '▶';
  }
  play_button.addEventListener('click', () => {
    if (audio.paused) {
      audio_players.forEach(other => {
        const other_audio = other.querySelector('audio');
        if (other_audio !== audio) other_audio.pause();
      });
      audio.play();
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('loadedmetadata', () => { duration.textContent = formatTime(audio.duration); });
  audio.addEventListener('play', () => updateButton(true));
  audio.addEventListener('pause', () => updateButton(false));
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const progress = audio.currentTime / audio.duration * 100;
    seek.value = progress;
    seek.style.setProperty('--progress', `${progress}%`);
    current.textContent = formatTime(audio.currentTime);
  });
  seek.addEventListener('input', () => {
    const progress = Number(seek.value);
    if (audio.duration) audio.currentTime = progress / 100 * audio.duration;
    seek.style.setProperty('--progress', `${progress}%`);
  });
});

const filter_buttons = [...document.querySelectorAll('[data-filter]')];
const catalog_items = [...document.querySelectorAll('[data-category]')];
const empty_note = document.querySelector('[data-empty]');
filter_buttons.forEach(button => {
  const filter = button.dataset.filter;
  const count = filter === 'all'
    ? catalog_items.length
    : catalog_items.filter(item => item.dataset.category === filter).length;
  const count_label = button.querySelector('span');
  if (count_label) count_label.textContent = String(count).padStart(2, '0');
});
filter_buttons.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  let visible_count = 0;
  filter_buttons.forEach(item => {
    const is_active = item === button;
    item.classList.toggle('active', is_active);
    item.setAttribute('aria-pressed', String(is_active));
  });
  catalog_items.forEach(item => {
    const is_visible = filter === 'all' || item.dataset.category === filter;
    item.hidden = !is_visible;
    if (is_visible) visible_count += 1;
  });
  if (empty_note) empty_note.hidden = visible_count !== 0;
}));

function startFlowField() {
  const canvas = document.querySelector('#flow-field');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const lines = 34;
  let animation_frame = 0;
  let start_time = performance.now();
  let is_visible = !document.hidden;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function draw(time) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const elapsed = reduced_motion.matches ? 0 : (time - start_time) * 0.00008;
    context.clearRect(0, 0, width, height);
    context.strokeStyle = 'rgba(17, 17, 17, 0.13)';
    context.lineWidth = 0.8;
    for (let line = 0; line < lines; line += 1) {
      const base_y = height * (line + 1) / (lines + 1);
      context.beginPath();
      for (let x = -20; x <= width + 20; x += 12) {
        const wave = Math.sin(x * 0.006 + line * 0.42 + elapsed * 18) * 18;
        const drift = Math.sin(x * 0.0022 - line * 0.19 - elapsed * 9) * 28;
        const envelope = Math.sin(Math.PI * x / Math.max(width, 1));
        const y = base_y + (wave + drift) * envelope;
        if (x === -20) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
    }
    if (is_visible && !reduced_motion.matches) animation_frame = requestAnimationFrame(draw);
  }
  function resetMotion() {
    cancelAnimationFrame(animation_frame);
    start_time = performance.now();
    draw(start_time);
  }
  resize();
  draw(start_time);
  window.addEventListener('resize', () => { resize(); resetMotion(); });
  reduced_motion.addEventListener('change', resetMotion);
  document.addEventListener('visibilitychange', () => {
    is_visible = !document.hidden;
    if (is_visible) resetMotion(); else cancelAnimationFrame(animation_frame);
  });
}
startFlowField();
document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
