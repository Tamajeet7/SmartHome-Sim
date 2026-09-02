// --- SmartHome-Sim IoT State & Device Registry ---

const DEFAULT_DEVICES = [
  // Living Room
  {
    id: 'living-light',
    room: 'living',
    name: 'Smart RGB Chandelier',
    type: 'light',
    power: true,
    brightness: 85,
    color: '#38bdf8',
    watts: 60,
    custom: false
  },
  {
    id: 'living-ac',
    room: 'living',
    name: 'Dual-Zone Climate HVAC',
    type: 'climate',
    power: true,
    targetTemp: 72,
    mode: 'Cool',
    watts: 750,
    custom: false
  },
  {
    id: 'living-cctv',
    room: 'living',
    name: 'Front Entry 4K Camera',
    type: 'cctv',
    power: true,
    motion: true,
    watts: 15,
    custom: false
  },
  {
    id: 'living-soundbar',
    room: 'living',
    name: 'Spatial Soundbar Pro',
    type: 'soundbar',
    power: false,
    track: 'Lofi Chill Beats',
    volume: 65,
    watts: 45,
    custom: false
  },

  // Bedroom
  {
    id: 'bedroom-light',
    room: 'bedroom',
    name: 'Circadian Bedside Lamp',
    type: 'light',
    power: true,
    brightness: 40,
    color: '#fbbf24',
    watts: 20,
    custom: false
  },
  {
    id: 'bedroom-blinds',
    room: 'bedroom',
    name: 'Motorized Smart Blinds',
    type: 'blinds',
    power: true,
    position: 80,
    watts: 15,
    custom: false
  },
  {
    id: 'bedroom-purifier',
    room: 'bedroom',
    name: 'Air Purifier HEPA Pro',
    type: 'purifier',
    power: true,
    aqi: 14,
    speed: 'Auto Eco',
    watts: 35,
    custom: false
  },
  {
    id: 'bedroom-noise',
    room: 'bedroom',
    name: 'Sleep Sound Generator',
    type: 'appliance',
    power: false,
    watts: 10,
    custom: false
  },

  // Kitchen
  {
    id: 'kitchen-espresso',
    room: 'kitchen',
    name: 'Smart Espresso Machine',
    type: 'espresso',
    power: false,
    isBrewing: false,
    brewSeconds: 0,
    watts: 1250,
    custom: false
  },
  {
    id: 'kitchen-fridge',
    room: 'kitchen',
    name: 'Smart French Door Fridge',
    type: 'fridge',
    power: true,
    fridgeTemp: 37,
    freezerTemp: 0,
    doorOpen: false,
    watts: 160,
    custom: false
  },
  {
    id: 'kitchen-light',
    room: 'kitchen',
    name: 'Under-Cabinet LED Strip',
    type: 'light',
    power: true,
    brightness: 90,
    color: '#f59e0b',
    watts: 30,
    custom: false
  },

  // Garage & Solar
  {
    id: 'garage-door',
    room: 'garage',
    name: 'Roll-Up Smart Garage Door',
    type: 'garage-door',
    power: false, // Closed
    state: 'Closed',
    watts: 120,
    custom: false
  },
  {
    id: 'garage-ev',
    room: 'garage',
    name: 'Tesla Wall Connector EV',
    type: 'ev-charger',
    power: true,
    batteryPct: 84,
    chargeKw: 11.5,
    watts: 2400,
    custom: false
  },
  {
    id: 'garage-flood',
    room: 'garage',
    name: 'Motion Floodlights',
    type: 'light',
    power: false,
    brightness: 100,
    color: '#ffffff',
    watts: 90,
    custom: false
  }
];

// --- Application State ---
let devices = [];
let currentRoom = 'living';
let brewInterval = null;

// --- DOM Elements ---
const elRoomTabs = document.querySelectorAll('.room-tab');
const elDevicesContainer = document.getElementById('devices-container');
const elQuickStatus = document.getElementById('system-quick-status');

// Header Telemetry
const elTelActiveDevices = document.getElementById('tel-active-devices');
const elTelPowerDraw = document.getElementById('tel-power-draw');
const elTelSolarOutput = document.getElementById('tel-solar-output');
const elWeatherTemp = document.getElementById('weather-temp');

// Footer Elements
const elFooterPlaying = document.getElementById('footer-now-playing');
const elFooterEqualizer = document.getElementById('footer-equalizer');
const elBtnResetDemo = document.getElementById('btn-reset-demo');

// Actions & Modals
const elBtnToggleRoom = document.getElementById('btn-toggle-all-room');
const elBtnAddModal = document.getElementById('btn-add-device-modal');
const modalAddDevice = document.getElementById('add-device-modal');
const formAddDevice = document.getElementById('add-device-form');
const btnCloseModal = document.getElementById('btn-close-device-modal');
const btnCancelModal = document.getElementById('btn-cancel-device-modal');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  loadDevices();
  initEventListeners();
  renderApp();
});

// --- Storage Management ---
function loadDevices() {
  try {
    const saved = localStorage.getItem('smarthome_devices_v2');
    if (saved) {
      devices = JSON.parse(saved);
    } else {
      devices = JSON.parse(JSON.stringify(DEFAULT_DEVICES));
    }
  } catch (err) {
    console.error('Error loading devices from localStorage:', err);
    devices = JSON.parse(JSON.stringify(DEFAULT_DEVICES));
  }
}

function saveDevices() {
  try {
    localStorage.setItem('smarthome_devices_v2', JSON.stringify(devices));
  } catch (err) {
    console.error('Error saving devices:', err);
  }
}

// --- Render Core App ---
function renderApp() {
  renderDevicesGrid();
  updateTelemetry();
  updateFooterAudio();
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

  const roomNameMap = {
    living: 'Living Room',
    bedroom: 'Bedroom',
    kitchen: 'Kitchen',
    garage: 'Garage & Solar',
    all: 'Whole House'
  };

  const currentRoomName = roomNameMap[currentRoom] || 'Living Room';
  const roomActive = devices.filter(d => (currentRoom === 'all' || d.room === currentRoom) && d.power).length;

  elQuickStatus.textContent = `${currentRoomName}: ${roomActive} active IoT nodes • Grid load optimal`;
}

// --- Footer Soundbar Visualizer ---
function updateFooterAudio() {
  const soundbar = devices.find(d => d.type === 'soundbar');
  if (soundbar && soundbar.power) {
    elFooterPlaying.textContent = `Spatial Soundbar • Playing: "${soundbar.track}" (${soundbar.volume}%)`;
    elFooterEqualizer.classList.add('playing');
  } else {
    elFooterPlaying.textContent = 'Spatial Audio Soundbar • Standby';
    elFooterEqualizer.classList.remove('playing');
  }
}

// --- Devices Grid Renderer ---
function renderDevicesGrid() {
  const filtered = devices.filter(d => {
    if (currentRoom === 'all') return true;
    return d.room === currentRoom;
  });

  if (filtered.length === 0) {
    elDevicesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">🔌</p>
        <h3>No devices in this room</h3>
        <p style="font-size: 0.85rem; margin-top: 4px;">Click <strong>＋ Add Device</strong> to add smart accessories.</p>
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
          <span>Brightness</span>
          <span class="brightness-val">${dev.power ? dev.brightness : 0}%</span>
        </div>
        <input type="range" min="1" max="100" value="${dev.brightness}" class="dev-range-slider light-slider" data-id="${dev.id}" ${!dev.power ? 'disabled' : ''}>
        <div class="rgb-palette-row">
          <button class="color-dot-btn ${dev.color === '#ffffff' ? 'active' : ''}" style="background-color: #ffffff;" data-id="${dev.id}" data-color="#ffffff" title="Daylight White"></button>
          <button class="color-dot-btn ${dev.color === '#38bdf8' ? 'active' : ''}" style="background-color: #38bdf8;" data-id="${dev.id}" data-color="#38bdf8" title="Ice Blue"></button>
          <button class="color-dot-btn ${dev.color === '#fbbf24' ? 'active' : ''}" style="background-color: #fbbf24;" data-id="${dev.id}" data-color="#fbbf24" title="Warm Amber"></button>
          <button class="color-dot-btn ${dev.color === '#a855f7' ? 'active' : ''}" style="background-color: #a855f7;" data-id="${dev.id}" data-color="#a855f7" title="Cyber Violet"></button>
          <button class="color-dot-btn ${dev.color === '#10b981' ? 'active' : ''}" style="background-color: #10b981;" data-id="${dev.id}" data-color="#10b981" title="Emerald Glow"></button>
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
          <div class="cctv-rec-badge"><span class="rec-dot"></span> LIVE REC</div>
          <span class="cctv-feed-text">CCTV 4K • NO MOTION</span>
        ` : `
          <span class="cctv-feed-text" style="color: var(--text-faint);">Camera Standby</span>
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
            <option value="Lofi Chill Beats" ${dev.track === 'Lofi Chill Beats' ? 'selected' : ''}>📻 Lofi Chill Beats</option>
            <option value="Synthwave Cyberpunk" ${dev.track === 'Synthwave Cyberpunk' ? 'selected' : ''}>🌃 Synthwave Cyber</option>
            <option value="Morning Acoustic Jazz" ${dev.track === 'Morning Acoustic Jazz' ? 'selected' : ''}>☕ Morning Jazz</option>
            <option value="Ambient Rainstorm" ${dev.track === 'Ambient Rainstorm' ? 'selected' : ''}>🌧️ Ambient Rain</option>
          </select>
        </div>
        <div class="media-btns">
          <button class="btn-media btn-vol-down" data-id="${dev.id}" title="Volume Down" ${!dev.power ? 'disabled' : ''}>🔉</button>
          <button class="btn-media btn-vol-up" data-id="${dev.id}" title="Volume Up" ${!dev.power ? 'disabled' : ''}>🔊</button>
        </div>
      </div>
    `;
  }

  // 5. Motorized Blinds
  else if (dev.type === 'blinds') {
    const slatOpacity = dev.power ? (dev.position / 100) : 0.2;
    controlHTML = `
      <div class="slider-control-box">
        <div class="slider-label-row">
          <span>Open Position</span>
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
          <span class="hvac-temp-val" style="color: var(--accent-emerald); font-size: 1.4rem;">${dev.power ? dev.aqi : '--'}</span>
          <span class="hvac-mode-pill" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">AQI EXCELLENT</span>
        </div>
        <span style="font-size: 0.72rem; color: var(--text-dim); font-weight: 600;">Fan: ${dev.power ? dev.speed : 'Off'}</span>
      </div>
    `;
  }

  // 7. Espresso Machine
  else if (dev.type === 'espresso') {
    controlHTML = `
      <button class="btn-brew-coffee ${dev.isBrewing ? 'brewing' : ''}" data-id="${dev.id}">
        <span>☕</span>
        <span>${dev.isBrewing ? `Brewing Espresso (${dev.brewSeconds}s)...` : 'Brew Fresh Espresso'}</span>
      </button>
    `;
  }

  // 8. EV Charger
  else if (dev.type === 'ev-charger') {
    controlHTML = `
      <div class="ev-battery-box">
        <div class="slider-label-row">
          <span>Battery Charge</span>
          <span style="color: var(--accent-emerald); font-weight: 700;">${dev.batteryPct}% (${dev.chargeKw} kW)</span>
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
        <span>🚪</span> ${dev.power ? 'Door Open (Click to Close)' : 'Door Closed (Click to Open)'}
      </button>
    `;
  }

  // Custom / General Appliance
  else {
    controlHTML = `
      <div style="font-size: 0.76rem; color: var(--text-dim); padding: 0.25rem 0;">
        ${dev.power ? '● Device Running Normally' : '○ Standby Mode'}
      </div>
    `;
  }

  const roomLabel = dev.room.toUpperCase();
  const statusSummary = getDeviceStatusSummary(dev);

  return `
    <div class="device-card ${isActive}" id="card-${dev.id}">
      <div class="dev-header">
        <div class="dev-icon-box" style="${dev.type === 'light' && dev.power ? `box-shadow: 0 0 16px ${dev.color}88; border-color: ${dev.color};` : ''}">
          ${icon}
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          ${dev.custom ? `<button class="btn-dev-delete" data-id="${dev.id}" title="Remove device">✕</button>` : ''}
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
  if (dev.type === 'light') return '💡';
  if (dev.type === 'climate') return '❄️';
  if (dev.type === 'cctv') return '📷';
  if (dev.type === 'soundbar') return '🎵';
  if (dev.type === 'blinds') return '🪟';
  if (dev.type === 'purifier') return '🍃';
  if (dev.type === 'espresso') return '☕';
  if (dev.type === 'fridge') return '🧊';
  if (dev.type === 'garage-door') return '🚪';
  if (dev.type === 'ev-charger') return '⚡';
  return '🔌';
}

function getDeviceStatusSummary(dev) {
  if (!dev.power) return 'Powered Off';
  if (dev.type === 'light') return `On • ${dev.brightness}% Brightness`;
  if (dev.type === 'climate') return `Cooling to ${dev.targetTemp}°F`;
  if (dev.type === 'cctv') return 'Recording Live Feed';
  if (dev.type === 'soundbar') return `Playing: ${dev.track}`;
  if (dev.type === 'blinds') return `Open • ${dev.position}%`;
  if (dev.type === 'purifier') return 'Purifying Air';
  if (dev.type === 'espresso') return dev.isBrewing ? 'Brewing...' : 'Ready to Brew';
  if (dev.type === 'garage-door') return 'Door Open';
  if (dev.type === 'ev-charger') return `Fast Charging at ${dev.chargeKw} kW`;
  return 'Active';
}

// --- Attach Device Action Listeners ---
function attachDeviceEventListeners() {
  // 1. Power Toggles
  elDevicesContainer.querySelectorAll('.toggle-device-power').forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const dev = devices.find(d => d.id === toggle.dataset.id);
      if (dev) {
        dev.power = e.target.checked;
        saveDevices();
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
        saveDevices();
        updateTelemetry();
        const card = document.getElementById(`card-${dev.id}`);
        if (card) {
          const badge = card.querySelector('.brightness-val');
          if (badge) badge.textContent = `${dev.brightness}%`;
          const status = card.querySelector('.dev-status-text');
          if (status) status.textContent = `On • ${dev.brightness}% Brightness`;
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
        saveDevices();
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
        saveDevices();
        renderApp();
      }
    });
  });

  elDevicesContainer.querySelectorAll('.btn-temp-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const dev = devices.find(d => d.id === btn.dataset.id);
      if (dev && dev.targetTemp < 85) {
        dev.targetTemp++;
        saveDevices();
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
        saveDevices();
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
        saveDevices();
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
        saveDevices();
        renderApp();
        showToast(`Garage door ${dev.power ? 'opening' : 'closing'}...`, 'amber');
      }
    });
  });

  // 9. Delete Custom Device
  elDevicesContainer.querySelectorAll('.btn-dev-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      devices = devices.filter(d => d.id !== btn.dataset.id);
      saveDevices();
      renderApp();
      showToast('Device removed from smart home.', 'danger');
    });
  });
}

// --- Espresso Machine Brew Simulation ---
function startEspressoBrew(dev) {
  dev.isBrewing = true;
  dev.power = true;
  dev.brewSeconds = 5;
  saveDevices();
  renderApp();
  showToast('☕ Brewing rich espresso shot...', 'success');

  if (brewInterval) clearInterval(brewInterval);
  brewInterval = setInterval(() => {
    dev.brewSeconds--;
    if (dev.brewSeconds <= 0) {
      clearInterval(brewInterval);
      dev.isBrewing = false;
      saveDevices();
      renderApp();
      showToast('☕ Espresso ready! Enjoy your coffee.', 'success');
    } else {
      renderApp();
    }
  }, 1000);
}

// --- 1-Click Automation Scenes ---
function triggerScene(sceneName) {
  if (sceneName === 'morning') {
    devices.forEach(d => {
      if (d.type === 'blinds') { d.power = true; d.position = 100; }
      if (d.type === 'climate') { d.power = true; d.targetTemp = 72; }
      if (d.type === 'espresso') { d.power = true; }
      if (d.room === 'kitchen' && d.type === 'light') { d.power = true; d.brightness = 90; d.color = '#ffffff'; }
      if (d.type === 'soundbar') { d.power = true; d.track = 'Morning Acoustic Jazz'; }
    });
    showToast('🌅 Scene "Good Morning" activated!', 'success');
  }

  else if (sceneName === 'movie') {
    devices.forEach(d => {
      if (d.id === 'living-light') { d.power = true; d.brightness = 20; d.color = '#a855f7'; }
      if (d.type === 'blinds') { d.position = 0; }
      if (d.type === 'soundbar') { d.power = true; d.track = 'Synthwave Cyberpunk'; }
    });
    showToast('🎬 Scene "Movie Night" activated!', 'success');
  }

  else if (sceneName === 'night') {
    devices.forEach(d => {
      if (d.type === 'light') d.power = false;
      if (d.type === 'soundbar') d.power = false;
      if (d.type === 'garage-door') d.power = false;
      if (d.type === 'blinds') d.position = 0;
      if (d.type === 'climate') { d.power = true; d.targetTemp = 68; }
      if (d.type === 'cctv') d.power = true;
    });
    showToast('🌙 Scene "Good Night" activated: House locked & lights off.', 'amber');
  }

  else if (sceneName === 'away') {
    devices.forEach(d => {
      if (d.type === 'light') d.power = false;
      if (d.type === 'soundbar') d.power = false;
      if (d.type === 'cctv') d.power = true;
      if (d.type === 'climate') { d.power = true; d.targetTemp = 78; }
      if (d.type === 'garage-door') d.power = false;
    });
    showToast('🛡️ Security Armed & Away Mode Active.', 'amber');
  }

  saveDevices();
  renderApp();
}

// --- Toggle Entire Room ---
function toggleCurrentRoom() {
  const roomDevs = devices.filter(d => currentRoom === 'all' || d.room === currentRoom);
  const anyOn = roomDevs.some(d => d.power);

  roomDevs.forEach(d => {
    d.power = !anyOn;
  });

  saveDevices();
  renderApp();
  showToast(`Toggled ${roomDevs.length} devices in current view.`, 'success');
}

// --- Add Custom Device Form ---
function handleAddDevice(e) {
  e.preventDefault();
  const name = document.getElementById('dev-name').value.trim();
  const room = document.getElementById('dev-room').value;
  const type = document.getElementById('dev-type').value;
  const power = parseInt(document.getElementById('dev-power').value) || 45;

  if (!name) return;

  const newDevice = {
    id: 'custom-' + Date.now(),
    room,
    name,
    type,
    power: true,
    brightness: 80,
    color: '#38bdf8',
    targetTemp: 72,
    watts: power,
    custom: true
  };

  devices.push(newDevice);
  saveDevices();
  modalAddDevice.classList.add('hidden');
  formAddDevice.reset();
  renderApp();
  showToast(`Added "${name}" to smart home!`, 'success');
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

  // Room Toggle Action
  elBtnToggleRoom.addEventListener('click', toggleCurrentRoom);

  // Add Device Modal
  elBtnAddModal.addEventListener('click', () => modalAddDevice.classList.remove('hidden'));
  btnCloseModal.addEventListener('click', () => modalAddDevice.classList.add('hidden'));
  btnCancelModal.addEventListener('click', () => modalAddDevice.classList.add('hidden'));
  formAddDevice.addEventListener('submit', handleAddDevice);

  // Reset Demo
  elBtnResetDemo.addEventListener('click', () => {
    if (confirm('Reset smart home devices to default factory preset?')) {
      devices = JSON.parse(JSON.stringify(DEFAULT_DEVICES));
      saveDevices();
      renderApp();
      showToast('Smart home reset to default setup.', 'success');
    }
  });

  // Modal backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === modalAddDevice) modalAddDevice.classList.add('hidden');
  });
}
