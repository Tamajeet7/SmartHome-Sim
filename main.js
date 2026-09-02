// --- CozyHome Smart IoT State & Device Registry ---

const SAMPLE_COZY_DEVICES = [
  // Cozy Living
  {
    id: 'living-light',
    room: 'living',
    name: 'Warm Ambient Chandelier',
    type: 'light',
    power: true,
    brightness: 80,
    color: '#ff8c7a',
    watts: 45,
    custom: false
  },
  {
    id: 'living-ac',
    room: 'living',
    name: 'Cozy Fireplace & Climate',
    type: 'climate',
    power: true,
    targetTemp: 72,
    mode: 'Warm Cozy',
    watts: 450,
    custom: false
  },
  {
    id: 'living-cctv',
    room: 'living',
    name: 'Garden & Porch Cam',
    type: 'cctv',
    power: true,
    motion: false,
    watts: 12,
    custom: false
  },
  {
    id: 'living-soundbar',
    room: 'living',
    name: 'Living Room Speaker',
    type: 'soundbar',
    power: true,
    track: 'Lofi Study Beats ☕',
    volume: 60,
    watts: 30,
    custom: false
  },

  // Comfy Bedroom
  {
    id: 'bedroom-light',
    room: 'bedroom',
    name: 'Candlelight Bedside Lamp',
    type: 'light',
    power: true,
    brightness: 35,
    color: '#fbb03b',
    watts: 15,
    custom: false
  },
  {
    id: 'bedroom-blinds',
    room: 'bedroom',
    name: 'Sunlight Motorized Blinds',
    type: 'blinds',
    power: true,
    position: 85,
    watts: 10,
    custom: false
  },
  {
    id: 'bedroom-purifier',
    room: 'bedroom',
    name: 'Quiet Breeze Air Purifier',
    type: 'purifier',
    power: true,
    aqi: 12,
    speed: 'Whisper Quiet',
    watts: 20,
    custom: false
  },

  // Warm Kitchen
  {
    id: 'kitchen-espresso',
    room: 'kitchen',
    name: 'Artisan Espresso Machine',
    type: 'espresso',
    power: false,
    isBrewing: false,
    brewSeconds: 0,
    watts: 950,
    custom: false
  },
  {
    id: 'kitchen-light',
    room: 'kitchen',
    name: 'Warm Counter Fairy Lights',
    type: 'light',
    power: true,
    brightness: 90,
    color: '#fbb03b',
    watts: 25,
    custom: false
  },

  // Garden & Garage
  {
    id: 'garage-door',
    room: 'garage',
    name: 'Cottage Garage & Gate',
    type: 'garage-door',
    power: false,
    state: 'Closed',
    watts: 100,
    custom: false
  },
  {
    id: 'garage-ev',
    room: 'garage',
    name: 'Electric Car Home Charger',
    type: 'ev-charger',
    power: true,
    batteryPct: 88,
    chargeKw: 9.6,
    watts: 1800,
    custom: false
  }
];

// --- Application State ---
let devices = [];
let userSavedDevices = [];
let isDemoMode = false;
let currentRoom = 'living';
let activeView = 'dashboard';
let brewInterval = null;

// --- DOM References ---
const elNavTabs = document.querySelectorAll('.nav-tab');
const elViews = {
  dashboard: document.getElementById('view-dashboard'),
  tutorial: document.getElementById('view-tutorial')
};

const elRoomTabs = document.querySelectorAll('.room-tab');
const elDevicesContainer = document.getElementById('devices-container');
const elEmptyHero = document.getElementById('sanctuary-empty-hero');
const elQuickStatus = document.getElementById('system-quick-status');

// Header Telemetry
const elTelActiveDevices = document.getElementById('tel-active-devices');
const elTelPowerDraw = document.getElementById('tel-power-draw');
const elTelSolarOutput = document.getElementById('tel-solar-output');
const elTelComfortScore = document.getElementById('tel-comfort-score');

// Demo Bar & Revert Controls
const elDemoBar = document.getElementById('demo-mode-bar');
const elDemoBtnLabel = document.getElementById('demo-btn-label');
const elBtnSampleData = document.getElementById('btn-sample-data');
const elBtnRevertData = document.getElementById('btn-revert-real-data');
const elUserDevCountBadge = document.getElementById('user-dev-count-badge');

// Footer Elements
const elFooterPlaying = document.getElementById('footer-now-playing');
const elFooterEqualizer = document.getElementById('footer-equalizer');
const elBtnResetDemo = document.getElementById('btn-reset-demo');
const elBtnClearSanctuary = document.getElementById('btn-clear-sanctuary');

// Actions & Modals
const elBtnToggleRoom = document.getElementById('btn-toggle-all-room');
const elBtnAddModal = document.getElementById('btn-add-device-modal');
const modalAddDevice = document.getElementById('add-device-modal');
const formAddDevice = document.getElementById('add-device-form');
const btnCloseModal = document.getElementById('btn-close-device-modal');
const btnCancelModal = document.getElementById('btn-cancel-device-modal');

// Hero Actions
const btnHeroAdd = document.getElementById('btn-hero-add');
const btnHeroSample = document.getElementById('btn-hero-sample');
const btnHeroTutorial = document.getElementById('btn-hero-tutorial');
const btnTutorialGoDash = document.getElementById('btn-tutorial-go-dash');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadDevices();
  initEventListeners();
  switchView('dashboard');
  renderApp();
});

// --- Storage Management ---
function loadDevices() {
  try {
    const saved = localStorage.getItem('cozyhome_user_devices_v4');
    if (saved) {
      userSavedDevices = JSON.parse(saved);
    } else {
      // Clean slate by default for new user
      userSavedDevices = [];
    }

    isDemoMode = false;
    devices = [...userSavedDevices];
  } catch (err) {
    console.error('Error loading devices from localStorage:', err);
    userSavedDevices = [];
    devices = [];
  }
}

function saveUserDevices() {
  try {
    if (!isDemoMode) {
      userSavedDevices = [...devices];
    }
    localStorage.setItem('cozyhome_user_devices_v4', JSON.stringify(userSavedDevices));
  } catch (err) {
    console.error('Error saving devices:', err);
  }
}

// --- View Switching ---
function switchView(viewName) {
  activeView = viewName;

  elNavTabs.forEach(tab => {
    if (tab.dataset.view === viewName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  Object.keys(elViews).forEach(key => {
    if (key === viewName) {
      elViews[key].classList.remove('hidden');
    } else {
      elViews[key].classList.add('hidden');
    }
  });

  if (viewName === 'dashboard') {
    renderApp();
  }
}

// --- Render Core App ---
function renderApp() {
  updateDemoStateUI();
  renderDevicesGrid();
  updateTelemetry();
  updateFooterAudio();
}

// --- Demo State UI Updates ---
function updateDemoStateUI() {
  if (elUserDevCountBadge) {
    elUserDevCountBadge.textContent = userSavedDevices.length;
  }

  if (isDemoMode) {
    if (elDemoBar) elDemoBar.classList.remove('hidden');
    if (elDemoBtnLabel) elDemoBtnLabel.textContent = 'My Real Setup';
    if (elBtnSampleData) {
      elBtnSampleData.classList.add('btn-primary');
      elBtnSampleData.classList.remove('btn-secondary');
    }
  } else {
    if (elDemoBar) elDemoBar.classList.add('hidden');
    if (elDemoBtnLabel) elDemoBtnLabel.textContent = 'Demo Setup';
    if (elBtnSampleData) {
      elBtnSampleData.classList.remove('btn-primary');
      elBtnSampleData.classList.add('btn-secondary');
    }
  }
}

// --- Telemetry & Header Status ---
function updateTelemetry() {
  const activeCount = devices.filter(d => d.power).length;
  const totalCount = devices.length;

  elTelActiveDevices.textContent = `${activeCount} / ${totalCount}`;

  // Compute total real-time wattage
  const totalWatts = devices
    .filter(d => d.power)
    .reduce((sum, d) => sum + (d.watts || 0), 0);

  elTelPowerDraw.textContent = `${totalWatts.toLocaleString()} W`;

  if (totalCount === 0) {
    elTelComfortScore.textContent = 'Ready to Build';
  } else {
    elTelComfortScore.textContent = `${Math.min(100, Math.round((activeCount / totalCount) * 100))}% Active`;
  }

  const roomNameMap = {
    living: 'Cozy Living',
    bedroom: 'Comfy Bedroom',
    kitchen: 'Warm Kitchen',
    garage: 'Garden & Garage',
    all: 'Whole Sanctuary'
  };

  const currentRoomName = roomNameMap[currentRoom] || 'Cozy Living';
  const roomActive = devices.filter(d => (currentRoom === 'all' || d.room === currentRoom) && d.power).length;

  if (devices.length === 0) {
    elQuickStatus.textContent = 'Sanctuary is empty & ready for your smart devices 🌱';
  } else {
    elQuickStatus.textContent = `${currentRoomName}: ${roomActive} active accessories • Everything warm & safe 🪴`;
  }
}

// --- Footer Soundbar Visualizer ---
function updateFooterAudio() {
  const soundbar = devices.find(d => d.type === 'soundbar');
  if (soundbar && soundbar.power) {
    elFooterPlaying.textContent = `Cozy Speaker • Playing: "${soundbar.track}" (${soundbar.volume}%)`;
    elFooterEqualizer.classList.add('playing');
  } else {
    elFooterPlaying.textContent = 'Living Room Speaker • Resting in standby 💤';
    elFooterEqualizer.classList.remove('playing');
  }
}

// --- Devices Grid Renderer ---
function renderDevicesGrid() {
  // Empty Hero handling
  if (devices.length === 0 && !isDemoMode) {
    elEmptyHero.classList.remove('hidden');
    elDevicesContainer.innerHTML = '';
    return;
  }

  elEmptyHero.classList.add('hidden');

  const filtered = devices.filter(d => {
    if (currentRoom === 'all') return true;
    return d.room === currentRoom;
  });

  if (filtered.length === 0) {
    elDevicesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
        <p style="font-size: 2.2rem; margin-bottom: 0.5rem;">🪴</p>
        <h3>No devices in this room yet</h3>
        <p style="font-size: 0.85rem; margin-top: 4px;">Click <strong>＋ Add Device</strong> to add cozy accessories.</p>
      </div>
    `;
    return;
  }

  elDevicesContainer.innerHTML = filtered.map(dev => generateDeviceCardHTML(dev)).join('');
  attachDeviceEventListeners();
}

// --- Device Card HTML Generator ---
function generateDeviceCardHTML(dev) {
  const icon = getDeviceIcon(dev);
  const isActive = dev.power ? 'is-active' : '';

  let controlHTML = '';

  // 1. Light Controls
  if (dev.type === 'light') {
    controlHTML = `
      <div class="slider-control-box">
        <div class="slider-label-row">
          <span>Warmth & Glow</span>
          <span class="brightness-val">${dev.power ? dev.brightness : 0}%</span>
        </div>
        <input type="range" min="1" max="100" value="${dev.brightness}" class="dev-range-slider light-slider" data-id="${dev.id}" ${!dev.power ? 'disabled' : ''}>
        <div class="rgb-palette-row">
          <button class="color-dot-btn ${dev.color === '#ff8c7a' ? 'active' : ''}" style="background-color: #ff8c7a;" data-id="${dev.id}" data-color="#ff8c7a" title="Peach Sunset"></button>
          <button class="color-dot-btn ${dev.color === '#fbb03b' ? 'active' : ''}" style="background-color: #fbb03b;" data-id="${dev.id}" data-color="#fbb03b" title="Warm Candlelight"></button>
          <button class="color-dot-btn ${dev.color === '#86efac' ? 'active' : ''}" style="background-color: #86efac;" data-id="${dev.id}" data-color="#86efac" title="Cozy Matcha"></button>
          <button class="color-dot-btn ${dev.color === '#d8b4fe' ? 'active' : ''}" style="background-color: #d8b4fe;" data-id="${dev.id}" data-color="#d8b4fe" title="Soft Lavender"></button>
          <button class="color-dot-btn ${dev.color === '#ffffff' ? 'active' : ''}" style="background-color: #ffffff;" data-id="${dev.id}" data-color="#ffffff" title="Soft Daylight"></button>
        </div>
      </div>
    `;
  }

  // 2. Climate HVAC
  else if (dev.type === 'climate') {
    controlHTML = `
      <div class="hvac-widget">
        <div class="hvac-temp-box">
          <span class="hvac-temp-val">${dev.power ? dev.targetTemp : '--'}°</span>
          <span class="hvac-mode-pill">${dev.power ? dev.mode : 'Off'}</span>
        </div>
        <div class="hvac-btn-group">
          <button class="btn-temp-step btn-temp-down" data-id="${dev.id}" ${!dev.power ? 'disabled' : ''}>－</button>
          <button class="btn-temp-step btn-temp-up" data-id="${dev.id}" ${!dev.power ? 'disabled' : ''}>＋</button>
        </div>
      </div>
    `;
  }

  // 3. Security Camera
  else if (dev.type === 'cctv') {
    controlHTML = `
      <div class="cctv-feed-viewport">
        <div class="cctv-scanline"></div>
        ${dev.power ? `
          <div class="cctv-rec-badge"><span class="rec-dot"></span> LIVE CAM</div>
          <span class="cctv-feed-text">🌸 Peaceful & Quiet</span>
        ` : `
          <span class="cctv-feed-text" style="color: var(--text-faint);">Camera Resting</span>
        `}
      </div>
    `;
  }

  // 4. Soundbar
  else if (dev.type === 'soundbar') {
    controlHTML = `
      <div class="media-ctrl-bar">
        <div class="track-select-box">
          <select class="track-select" data-id="${dev.id}" ${!dev.power ? 'disabled' : ''}>
            <option value="Lofi Study Beats ☕" ${dev.track === 'Lofi Study Beats ☕' ? 'selected' : ''}>☕ Lofi Beats</option>
            <option value="Soft Rain on Leaves 🌧️" ${dev.track === 'Soft Rain on Leaves 🌧️' ? 'selected' : ''}>🌧️ Soft Rain</option>
            <option value="Cozy Coffeehouse Jazz 🎷" ${dev.track === 'Cozy Coffeehouse Jazz 🎷' ? 'selected' : ''}>🎷 Coffeehouse Jazz</option>
            <option value="Gentle Ocean Waves 🌊" ${dev.track === 'Gentle Ocean Waves 🌊' ? 'selected' : ''}>🌊 Ocean Waves</option>
          </select>
        </div>
        <div class="media-btns">
          <button class="btn-media btn-vol-down" data-id="${dev.id}" title="Softer" ${!dev.power ? 'disabled' : ''}>🔉</button>
          <button class="btn-media btn-vol-up" data-id="${dev.id}" title="Louder" ${!dev.power ? 'disabled' : ''}>🔊</button>
        </div>
      </div>
    `;
  }

  // 5. Motorized Blinds
  else if (dev.type === 'blinds') {
    const slatOpacity = dev.power ? (dev.position / 100) : 0.25;
    controlHTML = `
      <div class="slider-control-box">
        <div class="slider-label-row">
          <span>Sunlight Opening</span>
          <span>${dev.power ? dev.position : 0}%</span>
        </div>
        <input type="range" min="0" max="100" value="${dev.position}" class="dev-range-slider blinds-slider" data-id="${dev.id}" ${!dev.power ? 'disabled' : ''}>
        <div class="blinds-viz">
          <div class="blind-slat" style="opacity: ${slatOpacity};"></div>
          <div class="blind-slat" style="opacity: ${slatOpacity};"></div>
          <div class="blind-slat" style="opacity: ${slatOpacity};"></div>
        </div>
      </div>
    `;
  }

  // 6. Air Purifier
  else if (dev.type === 'purifier') {
    controlHTML = `
      <div class="hvac-widget">
        <div class="hvac-temp-box">
          <span class="hvac-temp-val" style="color: var(--accent-matcha); font-size: 1.4rem;">${dev.power ? dev.aqi : '--'}</span>
          <span class="hvac-mode-pill" style="background: rgba(82, 183, 136, 0.2); color: #86efac;">PURE AIR 🌿</span>
        </div>
        <span style="font-size: 0.74rem; color: var(--text-dim); font-weight: 600;">Fan: ${dev.power ? dev.speed : 'Off'}</span>
      </div>
    `;
  }

  // 7. Espresso Machine
  else if (dev.type === 'espresso') {
    controlHTML = `
      <button class="btn-brew-coffee ${dev.isBrewing ? 'brewing' : ''}" data-id="${dev.id}">
        <span>☕</span>
        <span>${dev.isBrewing ? `Brewing Warm Latte (${dev.brewSeconds}s)...` : 'Brew Fresh Vanilla Latte'}</span>
      </button>
    `;
  }

  // 8. EV Charger
  else if (dev.type === 'ev-charger') {
    controlHTML = `
      <div class="ev-battery-box">
        <div class="slider-label-row">
          <span>Green Battery Energy</span>
          <span style="color: var(--accent-honey); font-weight: 700;">${dev.batteryPct}% (${dev.chargeKw} kW)</span>
        </div>
        <div class="ev-progress-bar">
          <div class="ev-fill" style="width: ${dev.batteryPct}%;"></div>
        </div>
      </div>
    `;
  }

  // 9. Smart Garage Door
  else if (dev.type === 'garage-door') {
    controlHTML = `
      <button class="btn btn-secondary btn-garage-toggle" data-id="${dev.id}" style="width: 100%;">
        <span>🏡</span> ${dev.power ? 'Gate Open (Click to Close)' : 'Gate Closed (Click to Open)'}
      </button>
    `;
  }

  // Custom Appliance
  else {
    controlHTML = `
      <div style="font-size: 0.78rem; color: var(--text-dim); padding: 0.25rem 0;">
        ${dev.power ? '● Cozy & Running Happily' : '○ Resting in Standby'}
      </div>
    `;
  }

  const roomLabel = dev.room.toUpperCase();
  const statusSummary = getDeviceStatusSummary(dev);

  return `
    <div class="device-card ${isActive}" id="card-${dev.id}">
      <div class="dev-header">
        <div class="dev-icon-box" style="${dev.type === 'light' && dev.power ? `box-shadow: 0 0 16px ${dev.color}99; border-color: ${dev.color};` : ''}">
          ${icon}
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="btn-dev-delete" data-id="${dev.id}" title="Remove device">✕</button>
          <label class="switch">
            <input type="checkbox" class="toggle-device-power" data-id="${dev.id}" ${dev.power ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="dev-info">
        <div class="dev-title-row">
          <h3 class="dev-title">${escapeHtml(dev.name)}</h3>
          <span class="dev-room-pill">${roomLabel}</span>
        </div>
        <p class="dev-status-text">${statusSummary}</p>
        <span class="dev-power-badge">${dev.power ? `${dev.watts} W` : '0 W'}</span>
      </div>

      ${controlHTML}
    </div>
  `;
}

function getDeviceIcon(dev) {
  if (dev.type === 'light') return '🕯️';
  if (dev.type === 'climate') return '🔥';
  if (dev.type === 'cctv') return '🌸';
  if (dev.type === 'soundbar') return '🎵';
  if (dev.type === 'blinds') return '🪟';
  if (dev.type === 'purifier') return '🍃';
  if (dev.type === 'espresso') return '☕';
  if (dev.type === 'fridge') return '🧊';
  if (dev.type === 'garage-door') return '🏡';
  if (dev.type === 'ev-charger') return '⚡';
  return '🔌';
}

function getDeviceStatusSummary(dev) {
  if (!dev.power) return 'Resting / Off';
  if (dev.type === 'light') return `Glowing at ${dev.brightness}% Warmth`;
  if (dev.type === 'climate') return `Keeping cozy at ${dev.targetTemp}°F`;
  if (dev.type === 'cctv') return 'Garden Peaceful';
  if (dev.type === 'soundbar') return `Playing: ${dev.track}`;
  if (dev.type === 'blinds') return `Sunlight in • ${dev.position}%`;
  if (dev.type === 'purifier') return 'Purifying with Fresh Breeze';
  if (dev.type === 'espresso') return dev.isBrewing ? 'Brewing...' : 'Ready for Warm Coffee';
  if (dev.type === 'garage-door') return 'Gate Welcoming';
  if (dev.type === 'ev-charger') return `Charging gently at ${dev.chargeKw} kW`;
  return 'Active & Happy';
}

// --- Attach Device Action Listeners ---
function attachDeviceEventListeners() {
  // 1. Power Toggles
  elDevicesContainer.querySelectorAll('.toggle-device-power').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const dev = devices.find(d => d.id === toggle.dataset.id);
      if (dev) {
        dev.power = e.target.checked;
        saveUserDevices();
        renderApp();
      }
    });
  });

  // 2. Light Brightness Slider
  elDevicesContainer.querySelectorAll('.light-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const dev = devices.find(d => d.id === slider.dataset.id);
      if (dev) {
        dev.brightness = parseInt(e.target.value);
        saveUserDevices();
        updateTelemetry();
        const card = document.getElementById(`card-${dev.id}`);
        if (card) {
          const badge = card.querySelector('.brightness-val');
          if (badge) badge.textContent = `${dev.brightness}%`;
          const status = card.querySelector('.dev-status-text');
          if (status) status.textContent = `Glowing at ${dev.brightness}% Warmth`;
        }
      }
    });
  });

  // 3. Light RGB Colors
  elDevicesContainer.querySelectorAll('.color-dot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dev = devices.find(d => d.id === btn.dataset.id);
      if (dev) {
        dev.color = btn.dataset.color;
        saveUserDevices();
        renderApp();
      }
    });
  });

  // 4. Climate HVAC Temp
  elDevicesContainer.querySelectorAll('.btn-temp-down').forEach(btn => {
    btn.addEventListener('click', () => {
      const dev = devices.find(d => d.id === btn.dataset.id);
      if (dev && dev.targetTemp > 60) {
        dev.targetTemp--;
        saveUserDevices();
        renderApp();
      }
    });
  });

  elDevicesContainer.querySelectorAll('.btn-temp-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const dev = devices.find(d => d.id === btn.dataset.id);
      if (dev && dev.targetTemp < 85) {
        dev.targetTemp++;
        saveUserDevices();
        renderApp();
      }
    });
  });

  // 5. Soundbar Track Change
  elDevicesContainer.querySelectorAll('.track-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const dev = devices.find(d => d.id === sel.dataset.id);
      if (dev) {
        dev.track = e.target.value;
        saveUserDevices();
        renderApp();
      }
    });
  });

  // 6. Blinds Slider
  elDevicesContainer.querySelectorAll('.blinds-slider').forEach(slider => {
    slider.addEventListener('input', (e) => {
      const dev = devices.find(d => d.id === slider.dataset.id);
      if (dev) {
        dev.position = parseInt(e.target.value);
        saveUserDevices();
        renderApp();
      }
    });
  });

  // 7. Espresso Brew Button
  elDevicesContainer.querySelectorAll('.btn-brew-coffee').forEach(btn => {
    btn.addEventListener('click', () => {
      const dev = devices.find(d => d.id === btn.dataset.id);
      if (dev && !dev.isBrewing) {
        startEspressoBrew(dev);
      }
    });
  });

  // 8. Garage Door Toggle
  elDevicesContainer.querySelectorAll('.btn-garage-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const dev = devices.find(d => d.id === btn.dataset.id);
      if (dev) {
        dev.power = !dev.power;
        saveUserDevices();
        renderApp();
        showToast(`Cottage gate ${dev.power ? 'welcoming you in' : 'closing safely'} 🏡`, 'amber');
      }
    });
  });

  // 9. Delete Device
  elDevicesContainer.querySelectorAll('.btn-dev-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      devices = devices.filter(d => d.id !== btn.dataset.id);
      saveUserDevices();
      renderApp();
      showToast('Device removed from sanctuary.', 'danger');
    });
  });
}

// --- Espresso Machine Brew Simulation ---
function startEspressoBrew(dev) {
  dev.isBrewing = true;
  dev.power = true;
  dev.brewSeconds = 5;
  saveUserDevices();
  renderApp();
  showToast('☕ Steaming sweet vanilla latte...', 'success');

  if (brewInterval) clearInterval(brewInterval);
  brewInterval = setInterval(() => {
    dev.brewSeconds--;
    if (dev.brewSeconds <= 0) {
      clearInterval(brewInterval);
      dev.isBrewing = false;
      saveUserDevices();
      renderApp();
      showToast('☕ Hot vanilla latte ready! Enjoy your cozy drink 🥐', 'success');
    } else {
      renderApp();
    }
  }, 1000);
}

// --- 1-Click Cozy Automation Scenes ---
function triggerScene(sceneName) {
  if (devices.length === 0) {
    showToast('Add smart devices to your sanctuary first to activate scenes! 🌸', 'amber');
    return;
  }

  if (sceneName === 'morning') {
    devices.forEach(d => {
      if (d.type === 'blinds') { d.power = true; d.position = 100; }
      if (d.type === 'climate') { d.power = true; d.targetTemp = 72; }
      if (d.type === 'espresso') { d.power = true; }
      if (d.room === 'kitchen' && d.type === 'light') { d.power = true; d.brightness = 90; d.color = '#fbb03b'; }
      if (d.type === 'soundbar') { d.power = true; d.track = 'Cozy Coffeehouse Jazz 🎷'; }
    });
    showToast('🥞 Sunny Morning preset activated! Warm sunlight & fresh coffee ☕', 'success');
  }

  else if (sceneName === 'movie') {
    devices.forEach(d => {
      if (d.id === 'living-light' || d.type === 'light') { d.power = true; d.brightness = 25; d.color = '#ff8c7a'; }
      if (d.type === 'blinds') { d.position = 0; }
      if (d.type === 'soundbar') { d.power = true; d.track = 'Lofi Study Beats ☕'; }
    });
    showToast('🍿 Cozy Movie Night activated! Warm peach glow & lofi beats ✨', 'success');
  }

  else if (sceneName === 'night') {
    devices.forEach(d => {
      if (d.type === 'light') d.power = false;
      if (d.type === 'soundbar') { d.power = true; d.track = 'Soft Rain on Leaves 🌧️'; d.volume = 35; }
      if (d.type === 'garage-door') d.power = false;
      if (d.type === 'blinds') d.position = 0;
      if (d.type === 'climate') { d.power = true; d.targetTemp = 68; }
      if (d.type === 'cctv') d.power = true;
    });
    showToast('🧸 Sweet Dreams preset activated! Soft rain sounds & cozy 68°F 🌙', 'amber');
  }

  else if (sceneName === 'away') {
    devices.forEach(d => {
      if (d.type === 'light') d.power = false;
      if (d.type === 'soundbar') d.power = false;
      if (d.type === 'cctv') d.power = true;
      if (d.type === 'climate') { d.power = true; d.targetTemp = 76; }
      if (d.type === 'garage-door') d.power = false;
    });
    showToast('🌿 Out & About! Eco mode active, plants happy & safe 🪴', 'amber');
  }

  saveUserDevices();
  renderApp();
}

// --- Toggle Entire Room ---
function toggleCurrentRoom() {
  const roomDevs = devices.filter(d => currentRoom === 'all' || d.room === currentRoom);
  if (roomDevs.length === 0) return;

  const anyOn = roomDevs.some(d => d.power);

  roomDevs.forEach(d => {
    d.power = !anyOn;
  });

  saveUserDevices();
  renderApp();
  showToast(`Switched ${roomDevs.length} cozy accessories.`, 'success');
}

// --- Demo Mode & Revert System ---
function toggleDemoMode() {
  if (isDemoMode) {
    revertToUserSanctuary();
  } else {
    loadSampleSanctuary();
  }
}

function loadSampleSanctuary() {
  if (!isDemoMode) {
    userSavedDevices = [...devices];
    saveUserDevices();
  }

  isDemoMode = true;
  devices = JSON.parse(JSON.stringify(SAMPLE_COZY_DEVICES));
  renderApp();
  showToast('⚡ Sample Cozy Setup loaded! Click "Return" anytime to restore your setup.', 'success');
}

function revertToUserSanctuary() {
  isDemoMode = false;
  devices = [...userSavedDevices];
  renderApp();
  showToast(`↩️ Returned to your personal sanctuary (${devices.length} devices)!`, 'success');
}

function clearSanctuary() {
  if (confirm('Clear all smart devices from your personal sanctuary?')) {
    isDemoMode = false;
    devices = [];
    userSavedDevices = [];
    saveUserDevices();
    renderApp();
    showToast('Sanctuary cleared to a fresh clean slate 🌱', 'amber');
  }
}

// --- Add Custom Device Form ---
function handleAddDevice(e) {
  e.preventDefault();
  const name = document.getElementById('dev-name').value.trim();
  const room = document.getElementById('dev-room').value;
  const type = document.getElementById('dev-type').value;
  const power = parseInt(document.getElementById('dev-power').value) || 35;

  if (!name) return;

  // If adding while in demo mode, automatically switch to personal sanctuary!
  if (isDemoMode) {
    isDemoMode = false;
    devices = [...userSavedDevices];
  }

  const newDevice = {
    id: 'custom-' + Date.now(),
    room,
    name,
    type,
    power: true,
    brightness: 80,
    color: '#ff8c7a',
    targetTemp: 72,
    position: 80,
    watts: power,
    custom: true
  };

  devices.unshift(newDevice);
  saveUserDevices();
  modalAddDevice.classList.add('hidden');
  formAddDevice.reset();
  renderApp();
  showToast(`✨ Added "${name}" to your cozy home! 🌸`, 'success');
}

// --- Toast System ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --- Event Listeners Setup ---
function initEventListeners() {
  // Navigation Tabs
  elNavTabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  if (btnTutorialGoDash) btnTutorialGoDash.addEventListener('click', () => switchView('dashboard'));
  if (btnHeroTutorial) btnHeroTutorial.addEventListener('click', () => switchView('tutorial'));

  // Hero Actions
  if (btnHeroAdd) btnHeroAdd.addEventListener('click', () => modalAddDevice.classList.remove('hidden'));
  if (btnHeroSample) btnHeroSample.addEventListener('click', loadSampleSanctuary);

  // Room Tabs
  elRoomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      elRoomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentRoom = tab.dataset.room;
      renderApp();
    });
  });

  // Automation Scenes
  document.querySelectorAll('.scene-btn[data-scene]').forEach(btn => {
    btn.addEventListener('click', () => triggerScene(btn.dataset.scene));
  });

  // Demo & Revert Action
  elBtnSampleData.addEventListener('click', toggleDemoMode);
  if (elBtnRevertData) elBtnRevertData.addEventListener('click', revertToUserSanctuary);
  if (elBtnResetDemo) elBtnResetDemo.addEventListener('click', loadSampleSanctuary);
  if (elBtnClearSanctuary) elBtnClearSanctuary.addEventListener('click', clearSanctuary);

  // Room Toggle Action
  elBtnToggleRoom.addEventListener('click', toggleCurrentRoom);

  // Add Device Modal
  elBtnAddModal.addEventListener('click', () => modalAddDevice.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => modalAddDevice.classList.add('hidden'));
  btnCancelModal.addEventListener('click', () => modalAddDevice.classList.add('hidden'));
  formAddDevice.addEventListener('submit', handleAddDevice);

  // Quick Starter Preset Chips in Modal
  document.querySelectorAll('.btn-chip[data-name]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('dev-name').value = chip.dataset.name;
      document.getElementById('dev-room').value = chip.dataset.room;
      document.getElementById('dev-type').value = chip.dataset.type;
      document.getElementById('dev-power').value = chip.dataset.power;
    });
  });

  // Modal backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === modalAddDevice) modalAddDevice.classList.add('hidden');
  });
}
