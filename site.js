const APPLE_STORE_URL = 'https://apps.apple.com/us/app/movingspot-brussels/id6769430023';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.brusselfever.app';
const storeAvailability = { apple: true, google: true };

function detectPlatform(userAgent, platform, maxTouchPoints) {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'apple';
  if (/Android/i.test(userAgent)) return 'google';
  return 'desktop';
}

const storeUrls = { apple: APPLE_STORE_URL, google: GOOGLE_PLAY_URL };
const storeLabels = { apple: 'Download on the App Store', google: 'Get it on Google Play' };
const platform = detectPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
const dialog = document.querySelector('#store-dialog');
let dialogTrigger;

function openStores(event) {
  if (!dialog || typeof dialog.showModal !== 'function') return;
  event.preventDefault();
  dialogTrigger = event.currentTarget;
  dialog.showModal();
  document.documentElement.classList.add('dialog-open');
}

function disableControl(control) {
  control.setAttribute('aria-disabled', 'true');
  control.setAttribute('tabindex', '-1');
  control.addEventListener('click', event => event.preventDefault());
}

function useGooglePlayBadge(link) {
  const image = document.createElement('img');
  image.className = 'store-badge-image';
  image.src = './assets/google-play.png';
  image.width = 1500;
  image.height = 1500;
  image.alt = 'Get it on Google Play';
  link.classList.remove('button', 'button-primary');
  link.classList.add('store-badge');
  link.dataset.store = 'google';
  link.replaceChildren(image);
}

function useAppStoreBadge(link) {
  const image = document.createElement('img');
  image.className = 'store-badge-image';
  image.src = './assets/app-store.png';
  image.width = 775;
  image.height = 300;
  image.alt = 'Download on the App Store';
  link.classList.remove('button', 'button-primary');
  link.classList.add('store-badge');
  link.dataset.store = 'apple';
  link.replaceChildren(image);
}

function simplifyAndroidDownloads() {
  document.querySelector('[data-download-nav]')?.remove();
  document.querySelector('[data-download-bottom]')?.remove();
  document.querySelector('#store-options [data-store="apple"]')?.remove();
}

if (platform === 'google') simplifyAndroidDownloads();
if (platform === 'apple') document.querySelector('[data-download-nav]')?.remove();

document.querySelectorAll('[data-store]').forEach(link => {
  const store = link.dataset.store;
  if (!storeAvailability[store]) {
    disableControl(link);
    return;
  }
  link.href = storeUrls[store];
  link.removeAttribute('aria-disabled');
  link.removeAttribute('tabindex');
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
});

document.querySelectorAll('[data-download]').forEach(link => {
  if (platform === 'desktop') {
    if (dialog && typeof dialog.showModal === 'function') {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', openStores);
    }
    return;
  }

  if (!storeAvailability[platform]) {
    disableControl(link);
    const text = link.querySelector('[data-download-label]');
    if (text) text.textContent = 'Coming soon';
    link.querySelector('[data-download-label] + [aria-hidden]')?.remove();
    link.setAttribute('aria-label', 'MovingSpot is coming soon on iOS');
    return;
  }

  link.href = storeUrls[platform];
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const label = storeLabels[platform];
  if (link.hasAttribute('data-download-hero')) {
    if (platform === 'google') useGooglePlayBadge(link);
    if (platform === 'apple') useAppStoreBadge(link);
  }
  const text = link.querySelector('[data-download-label]');
  if (text) text.textContent = label;
  link.setAttribute('aria-label', `${label} (opens in a new tab)`);
});
if (dialog) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('dialog-open');
    dialogTrigger?.focus({ preventScroll: true });
  });
}

const discoveryImage = document.querySelector('#discovery-image');
const discoveryCaption = document.querySelector('#discovery-caption');
document.querySelectorAll('[data-mode]').forEach(button => {
  button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(choice => {
      choice.setAttribute('aria-pressed', String(choice === button));
      choice.classList.toggle('is-active', choice === button);
    });
    discoveryImage.srcset = `./assets/map-${mode}-390.webp 390w, ./assets/map-${mode}-780.webp 780w`;
    discoveryImage.src = `./assets/map-${mode}-780.webp`;
    discoveryImage.alt = mode === 'on' ? "What's On view with nearby events on the map and an event list." : "Who's Out view with place markers and a Trending Now list of places where people are present.";
    discoveryCaption.textContent = mode === 'on' ? 'What’s On · Find something worth going out for.' : 'Who’s Out · Find where people are hanging out.';
  });
});

const vibes = {
  calm: ['Calm', 'A little quieter. Room to catch up.'],
  lively: ['Lively', 'People around. Something in the air.'],
  fevering: ['Fevering', 'A packed spot. The energy is up.'],
};
const vibeOrder = ['calm', 'lively', 'fevering'];
const vibeSlider = document.querySelector('#vibe-slider');

function selectVibe(vibe) {
  document.querySelector('.vibe-demo').dataset.vibe = vibe;
  document.querySelector('#vibe-state').textContent = vibes[vibe][0];
  document.querySelector('#vibe-description').textContent = vibes[vibe][1];
  vibeSlider.value = vibeOrder.indexOf(vibe);
  vibeSlider.setAttribute('aria-valuetext', vibes[vibe][0]);
  document.querySelectorAll('[data-vibe-option]').forEach(choice => {
    choice.setAttribute('aria-pressed', String(choice.dataset.vibeOption === vibe));
  });
}

vibeSlider?.addEventListener('input', () => selectVibe(vibeOrder[Number(vibeSlider.value)]));
document.querySelectorAll('[data-vibe-option]').forEach(button => {
  button.addEventListener('click', () => selectVibe(button.dataset.vibeOption));
});
