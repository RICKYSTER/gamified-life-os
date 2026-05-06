// ── CONFIGURATION (Ready for Notion API) ──
const CONFIG = {
  // Replace these with your actual Notion Database IDs when connecting via API
  notion_radar_db: "YOUR_RADAR_DB_ID",
  notion_habits_db: "YOUR_HABITS_DB_ID",
  notion_logs_db: "YOUR_DAILY_LOGS_DB_ID",
  use_local_storage_fallback: true
};

// ── STATE ──
let STATE = {
  // Appearance
  theme: {
    heatmap: 'green',
    simpleRadar: '#a78bfa'
  },
  // Simple Radar (Overview)
  simpleRadar: {
    Health: { current: 70, target: 90 },
    Career: { current: 60, target: 85 },
    Finances: { current: 45, target: 80 },
    Learning: { current: 80, target: 95 },
    Mindset: { current: 55, target: 75 },
    Social: { current: 40, target: 80 }
  },
  // Multi-layered Radar Chart Data
  complexRadar: {
    labels: ["Understanding", "Clarity", "Swiftness", "Accuracy", "Depth"],
    datasets: [
      { name: "Math: Calculus", color: "#39d353", data: [80, 60, 90, 70, 50] },
      { name: "Physics: Kinematics", color: "#a78bfa", data: [40, 80, 50, 90, 70] },
      { name: "Chemistry: Orgo", color: "#54aeff", data: [90, 90, 80, 60, 80] }
    ]
  },
  logs: [] 
};

// ── API LAYER ──
async function loadData() {
  if (CONFIG.use_local_storage_fallback) {
    const local = localStorage.getItem('ontrack_state');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        // Safely merge so we don't lose default objects like 'theme' if old state didn't have them
        STATE.simpleRadar = parsed.simpleRadar || STATE.simpleRadar;
        STATE.complexRadar = parsed.complexRadar || STATE.complexRadar;
        // Migration from old keys if needed
        if (parsed.radar) STATE.complexRadar = parsed.radar;
        if (parsed.areas) STATE.simpleRadar = parsed.areas;
        if (parsed.theme) {
          STATE.theme.heatmap = parsed.theme.heatmap || STATE.theme.heatmap;
          STATE.theme.simpleRadar = parsed.theme.simpleRadar || parsed.theme.radar || STATE.theme.simpleRadar;
        }
      } catch (e) {
        console.error("Local storage corrupted, using defaults.");
      }
    }
  } else {
    try {
      const response = await fetch('/api/notion');
      if (!response.ok) throw new Error('API fetch failed');
      const liveData = await response.json();
      
      // Merge live data securely
      if (liveData.areas) STATE.areas = liveData.areas;
      // if (liveData.habits) STATE.habits = liveData.habits; // Requires custom Notion parsing in api/notion.js
      
      console.log("Successfully connected to Notion API");
    } catch (err) {
      console.error("Failed to fetch from Notion, using local state", err);
    }
  }
}

function save() {
  if (CONFIG.use_local_storage_fallback) {
    localStorage.setItem('ontrack_state', JSON.stringify(STATE));
  } else {
    // TODO: fetch('YOUR_SERVERLESS_FUNCTION/notion-update', { method: 'POST', body: STATE })
  }
}

// ── RADAR CHARTS ──
let simpleRadarChart;
let complexRadarChart;

function initSimpleRadar() {
  const ctx = document.getElementById('simpleRadarChart').getContext('2d');
  
  const labels = Object.keys(STATE.simpleRadar);
  const dataCurrent = Object.values(STATE.simpleRadar).map(v => v.target ? (v.current / v.target) * 100 : 0);
  const dataTarget = Object.values(STATE.simpleRadar).map(v => 100);
  const radarColor = STATE.theme.simpleRadar;

  simpleRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Current Level',
          data: dataCurrent,
          backgroundColor: `${radarColor}44`,
          borderColor: radarColor,
          borderWidth: 2,
          pointBackgroundColor: radarColor,
          pointRadius: 3
        },
        {
          label: 'Target Goal',
          data: dataTarget,
          backgroundColor: 'transparent',
          borderColor: 'rgba(255,255,255,0.2)',
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.1)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: '#9a9a9a', font: { size: 10 } },
          ticks: { display: false },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const areaName = context.chart.data.labels[context.dataIndex];
              const area = STATE.simpleRadar[areaName];
              if (context.datasetIndex === 0) {
                return `Current: ${area.current} / ${area.target}`;
              } else {
                return `Target: ${area.target}`;
              }
            }
          }
        }
      }
    }
  });
}

function updateSimpleRadar() {
  const radarColor = STATE.theme.simpleRadar;
  simpleRadarChart.data.labels = Object.keys(STATE.simpleRadar);
  simpleRadarChart.data.datasets[0].data = Object.values(STATE.simpleRadar).map(v => v.target ? (v.current / v.target) * 100 : 0);
  simpleRadarChart.data.datasets[1].data = Object.values(STATE.simpleRadar).map(v => 100);
  simpleRadarChart.update();
  renderStatsLegend();
}

function renderStatsLegend() {
  const el = document.getElementById('statsLegend');
  if (el) {
    el.innerHTML = Object.entries(STATE.simpleRadar).map(([name, val]) => `
      <div class="stat-item">${name}: <strong>${val.current}</strong><span style="opacity:0.5">/${val.target}</span></div>
    `).join('');
  }
}

function initComplexRadar() {
  const ctx = document.getElementById('complexRadarChart').getContext('2d');
  
  const chartDatasets = STATE.complexRadar.datasets.map(ds => ({
    label: ds.name,
    data: ds.data,
    backgroundColor: ds.color + '44',
    borderColor: ds.color,
    borderWidth: 2,
    pointBackgroundColor: ds.color,
    pointRadius: 3
  }));

  complexRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: STATE.complexRadar.labels,
      datasets: chartDatasets
    },
    options: {
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.1)' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: '#9a9a9a', font: { size: 10 } },
          ticks: { display: false },
          suggestedMin: 0,
          suggestedMax: 100
        }
      },
      plugins: { 
        legend: { display: true, position: 'bottom', labels: { color: '#fff', font: { family: 'monospace', size: 11 } } },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.raw}`;
            }
          }
        }
      }
    }
  });
}

function updateComplexRadar() {
  complexRadarChart.data.labels = STATE.complexRadar.labels;
  complexRadarChart.data.datasets = STATE.complexRadar.datasets.map(ds => ({
    label: ds.name,
    data: ds.data,
    backgroundColor: ds.color + '44',
    borderColor: ds.color,
    borderWidth: 2,
    pointBackgroundColor: ds.color,
    pointRadius: 3
  }));
  complexRadarChart.update();
}

// ── HEATMAP & YEAR SELECTOR ──
let activeYear = new Date().getFullYear();

function renderYearSelector() {
  const el = document.getElementById('yearSelector');
  if (!el) return;
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  el.innerHTML = years.map(y => `
    <button class="year-btn ${y === activeYear ? 'active' : ''}" onclick="selectYear(${y})">${y}</button>
  `).join('');
}

window.selectYear = function(y) {
  activeYear = y;
  renderYearSelector();
  renderHeatmap();
};

function renderHeatmap() {
  const el = document.getElementById('heatmapGrid');
  const monthEl = document.getElementById('heatmapMonths');
  if (!el) return;
  el.innerHTML = '';
  if (monthEl) monthEl.innerHTML = '';
  
  const today = new Date();
  
  // Apply saved color theme
  const card = document.getElementById('heatmapCard');
  if (card) card.setAttribute('data-theme', STATE.theme.heatmap);
  
  // Calculate Grid: Jan 1 to Dec 31 of activeYear, padded to Sunday-Saturday
  const startDate = new Date(activeYear, 0, 1);
  const endDate = new Date(activeYear, 11, 31);
  while (startDate.getDay() !== 0) startDate.setDate(startDate.getDate() - 1); // Rewind to Sunday
  
  let currentDate = new Date(startDate);
  let totalHabits = 0;
  let colIndex = 0;
  
  while (currentDate.getFullYear() <= activeYear || currentDate.getDay() !== 0) {
    if (currentDate.getFullYear() > activeYear && currentDate.getDay() === 0) break; // Reached next year's first Sunday
    
    const isCurrentYear = currentDate.getFullYear() === activeYear;
    let intensity = 0;
    
    // Mock Data Logic
    if (isCurrentYear && currentDate <= today) {
      intensity = Math.floor(Math.random() * 3); 
      if (currentDate.toDateString() === today.toDateString()) {
         intensity = 4; // Fake today's data heavily
      }
      totalHabits += intensity * 3; // Mock formula for count
    }
    
    const cell = document.createElement('div');
    // If not in current year, or in the future, it stays lvl-0 (or transparent)
    if (isCurrentYear && currentDate <= today) {
      cell.className = `h-cell lvl-${intensity}`;
    } else {
      cell.className = `h-cell lvl-0`; // empty/future
      cell.style.opacity = '0.3';
    }

    const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    cell.title = `${intensity > 0 ? intensity * 3 : 'No'} habits on ${dateStr}`;
    el.appendChild(cell);

    // Month label logic
    if (currentDate.getDate() === 1 && isCurrentYear && monthEl) {
      const monthStr = currentDate.toLocaleDateString('en-US', { month: 'short' });
      const span = document.createElement('span');
      span.innerText = monthStr;
      span.style.gridColumn = Math.floor(colIndex / 7) + 1;
      monthEl.appendChild(span);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    colIndex++;
  }
  
  const headerEl = document.getElementById('heatmapTitle');
  if (headerEl) {
    headerEl.innerText = `${totalHabits.toLocaleString()} habits completed in ${activeYear}`;
  }
}

// ── SETTINGS UI ──
window.toggleSettings = function() {
  document.getElementById('settingsPanel').classList.toggle('active');
};

// ── EDIT DATA UI ──
window.toggleEditData = function() {
  const modal = document.getElementById('editDataModal');
  if (modal.classList.contains('active')) {
    modal.classList.remove('active');
  } else {
    renderEditForms();
    modal.classList.add('active');
    // Hide settings panel if open
    document.getElementById('settingsPanel').classList.remove('active');
  }
};

window.renderEditForms = function() {
  // Simple Form
  const simpleEl = document.getElementById('editSimpleAreasList');
  simpleEl.innerHTML = Object.entries(STATE.simpleRadar).map(([name, val], i) => `
    <div class="edit-row">
      <input type="text" class="edit-input area-name" value="${name}" placeholder="Area Name">
      <input type="number" class="edit-input num area-cur" value="${val.current}" placeholder="Cur">
      <input type="number" class="edit-input num area-tar" value="${val.target}" placeholder="Tar">
      <button class="btn-danger" onclick="this.parentElement.remove()">X</button>
    </div>
  `).join('');

  // Complex Form
  document.getElementById('editRadarAxes').value = STATE.complexRadar.labels.join(', ');
  const layersEl = document.getElementById('editRadarLayers');
  layersEl.innerHTML = STATE.complexRadar.datasets.map((ds, i) => `
    <div class="edit-row">
      <input type="color" class="edit-input num layer-color" value="${ds.color}" style="padding:0; width:32px; height:32px; cursor:pointer;">
      <input type="text" class="edit-input layer-name" value="${ds.name}" placeholder="Layer Name">
      <input type="text" class="edit-input layer-data" value="${ds.data.join(', ')}" placeholder="Values (e.g. 50, 60, 80)">
      <button class="btn-danger" onclick="this.parentElement.remove()">X</button>
    </div>
  `).join('');
};

window.addSimpleArea = function() {
  const el = document.getElementById('editSimpleAreasList');
  const div = document.createElement('div');
  div.className = 'edit-row';
  div.innerHTML = `
    <input type="text" class="edit-input area-name" value="" placeholder="Area Name">
    <input type="number" class="edit-input num area-cur" value="0" placeholder="Cur">
    <input type="number" class="edit-input num area-tar" value="100" placeholder="Tar">
    <button class="btn-danger" onclick="this.parentElement.remove()">X</button>
  `;
  el.appendChild(div);
};

window.addRadarLayer = function() {
  const layersEl = document.getElementById('editRadarLayers');
  const div = document.createElement('div');
  div.className = 'edit-row';
  div.innerHTML = `
      <input type="color" class="edit-input num layer-color" value="#ffffff" style="padding:0; width:32px; height:32px; cursor:pointer;">
      <input type="text" class="edit-input layer-name" value="" placeholder="Layer Name">
      <input type="text" class="edit-input layer-data" value="" placeholder="Values (e.g. 50, 60, 80)">
      <button class="btn-danger" onclick="this.parentElement.remove()">X</button>
  `;
  layersEl.appendChild(div);
};

window.saveDataEdits = function() {
  // Save Simple
  const newSimple = {};
  document.querySelectorAll('#editSimpleAreasList .edit-row').forEach(row => {
    const name = row.querySelector('.area-name').value.trim();
    const cur = parseInt(row.querySelector('.area-cur').value) || 0;
    const tar = parseInt(row.querySelector('.area-tar').value) || 0;
    if (name) newSimple[name] = { current: cur, target: tar };
  });
  STATE.simpleRadar = newSimple;

  // Save Complex
  const axesVal = document.getElementById('editRadarAxes').value;
  STATE.complexRadar.labels = axesVal.split(',').map(s => s.trim()).filter(s => s);
  
  const newDatasets = [];
  document.querySelectorAll('#editRadarLayers .edit-row').forEach(row => {
    const color = row.querySelector('.layer-color').value;
    const name = row.querySelector('.layer-name').value.trim();
    const dataStr = row.querySelector('.layer-data').value;
    const data = dataStr.split(',').map(s => parseFloat(s.trim()) || 0);
    if (name) newDatasets.push({ name, color, data });
  });
  STATE.complexRadar.datasets = newDatasets;

  save();
  updateSimpleRadar();
  updateComplexRadar();
  toggleEditData();
};

window.setHeatmapTheme = function(colorStr) {
  STATE.theme.heatmap = colorStr;
  save();
  const card = document.getElementById('heatmapCard');
  if (card) card.setAttribute('data-theme', colorStr);
};



// ── INIT ──
window.onload = async () => {
  await loadData(); // Fetch from Notion (or local storage fallback)
  initSimpleRadar();
  initComplexRadar();
  renderStatsLegend();
  renderYearSelector();
  renderHeatmap();
};

// ── TABS ──
window.switchTab = function(tabId) {
  // Update content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  const tabEl = document.getElementById('tab-' + tabId);
  if (tabEl) tabEl.classList.add('active');
  
  // Update buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};
