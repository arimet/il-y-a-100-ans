import { dateKey, iiifUrl, itemUrl } from './lib/issues.mjs';

const $ = (id) => document.getElementById(id);
const index = await (await fetch('data/issues.json')).json();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canMorph = !reducedMotion && document.startViewTransition;

// The day being shown: today, 100 years ago. `offset` counts days away from it.
const day = new Date();
day.setFullYear(day.getFullYear() - 100);
let offset = 0;
let issues = [];
let current = 0;

const longDate = () =>
  day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// One <span> per character so the date can rise letter by letter.
// Words are wrapped too, otherwise the browser may break "septembre" between two letters.
function letters(text, className, start) {
  let i = start;
  const words = text.split(' ').map((word) =>
    `<span class="word">${[...word].map((char) => `<span class="char" style="--index:${i++}">${char}</span>`).join('')}</span>`);
  return `<span class="line ${className}">${words.join(' ')}</span>`;
}

function renderDate() {
  const weekday = day.toLocaleDateString('fr-FR', { weekday: 'long' });
  const month = day.toLocaleDateString('fr-FR', { month: 'long' });
  const dayMonth = `${day.getDate() === 1 ? '1er' : day.getDate()} ${month}`;
  const el = $('date');
  el.setAttribute('aria-label', longDate());
  el.innerHTML = letters(weekday, 'weekday', 0) + letters(dayMonth, 'day-month', 4) + letters(String(day.getFullYear()), 'year', 10);
}

function renderFan() {
  const middle = (issues.length - 1) / 2;
  $('fan').innerHTML = issues.map(({ paper, ark }, i) => `
    <button class="leaf" data-issue="${i}" style="--spread:${i - middle};--index:${i}" aria-label="Lire la une du ${paper} en grand">
      <b>${paper}</b><img src="${iiifUrl(ark)}" alt=""></button>`).join('');
}

function renderTicker() {
  const days = Math.round((Date.now() - day) / 864e5).toLocaleString('fr-FR');
  const items = [longDate(), `il y a ${days} jours`, ...issues.map(({ paper }) => paper)];
  const run = items.map((item) => `<span>${item}</span>`).join('');
  $('ticker').innerHTML = run + run; // two copies make the loop seamless
}

function renderGrid() {
  $('front-pages').innerHTML = issues.map(({ paper, ark }, i) => `
    <li class="card" style="--index:${i}">
      <button class="sheet" data-issue="${i}" aria-label="Lire la une du ${paper} en grand">
        <span class="frame"><span class="placeholder"><b>${paper}</b><i>Sous presse…</i></span>
          <img src="${iiifUrl(ark)}" alt="Une du ${paper}, ${longDate()}"></span>
        <span class="caption">${paper}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></span>
      </button>
    </li>`).join('');
}

// Gallica images take seconds to arrive: flag each container once its image is in.
function watchImages() {
  for (const img of document.querySelectorAll('.frame img, .leaf img')) {
    const box = img.parentElement;
    const loaded = () => box.classList.add('loaded');
    if (img.complete && img.naturalWidth) loaded();
    img.onload = loaded;
    img.onerror = () => {
      box.classList.add('failed');
      const status = box.querySelector('i');
      if (status) status.textContent = 'Image indisponible';
    };
  }
}

function render() {
  issues = index[day.getFullYear()]?.[dateKey(day)] ?? [];
  $('today').hidden = offset === 0;
  $('empty').hidden = issues.length > 0;
  renderDate();
  renderFan();
  renderTicker();
  renderGrid();
  watchImages();
}

function moveBy(days) {
  day.setDate(day.getDate() + days);
  offset += days;
  render();
}

$('prev').onclick = () => moveBy(-1);
$('next').onclick = () => moveBy(1);
$('today').onclick = () => moveBy(-offset);

// ---------- Viewer ----------
const viewer = $('viewer');
const image = $('viewer-image');
const stage = $('stage');

function show(i) {
  current = (i + issues.length) % issues.length;
  const { paper, ark } = issues[current];
  $('viewer-title').replaceChildren(paper, Object.assign(document.createElement('small'), { textContent: longDate() }));
  $('viewer-link').href = itemUrl(ark);
  image.alt = `Une du ${paper}, ${longDate()}`;
  image.src = iiifUrl(ark); // already cached: shows instantly, then the high-resolution version replaces it
  stage.classList.remove('zoomed');
  const hd = new Image();
  hd.onload = () => { if (issues[current]?.ark === ark) image.src = hd.src; };
  hd.src = iiifUrl(ark, 1600);
}

// The thumbnail morphs into the full-screen image (View Transitions), on open and on close.
function morph(from, to, update) {
  if (!canMorph || !from || !to) return update();
  from.style.viewTransitionName = 'front-page';
  const transition = document.startViewTransition(() => {
    from.style.viewTransitionName = '';
    to.style.viewTransitionName = 'front-page';
    update();
  });
  transition.ready.catch(() => {}); // skipped transitions (e.g. hidden tab) still run `update`
  transition.finished.finally(() => { to.style.viewTransitionName = ''; });
}

const gridImage = () => document.querySelectorAll('#front-pages .frame img')[current];

// A sheet from the fan or the grid opens the same viewer.
document.addEventListener('click', (event) => {
  const sheet = event.target.closest('[data-issue]');
  if (!sheet) return;
  current = Number(sheet.dataset.issue);
  morph(sheet.querySelector('img'), image, () => { show(current); viewer.showModal(); });
});

function closeViewer() { morph(image, gridImage(), () => viewer.close()); }

$('viewer-close').onclick = closeViewer;
$('viewer-prev').onclick = () => show(current - 1);
$('viewer-next').onclick = () => show(current + 1);

// Click to zoom where the pointer is, click again to fit.
image.onclick = (event) => {
  const x = event.offsetX / image.clientWidth;
  const y = event.offsetY / image.clientHeight;
  if (!stage.classList.toggle('zoomed')) return;
  stage.scrollTo(x * image.clientWidth - stage.clientWidth / 2, y * image.clientHeight - stage.clientHeight / 2);
};

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  // Escape is handled here rather than on the dialog's "cancel" event:
  // Chrome may ignore preventDefault() there and close the dialog mid-transition.
  if (event.key === 'Escape' && viewer.open) {
    event.preventDefault();
    return closeViewer();
  }
  const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
  if (!step) return;
  if (viewer.open) show(current + step);
  else moveBy(step);
});

// The background light follows the pointer (at most one update per frame).
let frame = 0;
addEventListener('pointermove', (event) => {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    document.body.style.setProperty('--pointer-x', `${event.clientX}px`);
    document.body.style.setProperty('--pointer-y', `${event.clientY}px`);
  });
});

render();
