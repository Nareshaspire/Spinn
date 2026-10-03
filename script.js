const DEFAULT_ROSTER = [
  'Nagendra Sai Achanta',
  'Sujay Gurrala',
  'Leekshith Reddy Tippaluru',
  'Ramanpreet Kaur',
  'S. Archana K.',
  'Naresh Aspire',
  'Charan Karnan',
  'Suneetha',
  'Parithosh Kumar',
  'Sundeep Nagasamudram',
  'Swathy Cholleti',
  'Prathyusha Ramanathi',
  'Akshay Nandagowli',
  'k45078982',
  'Saru',
  'Khizaruddin Khizaruddin',
  'Charanya Peddi',
  'N. Govind',
  'Niha Jakku',
  'Sai Kumar Ch',
  'Gola Srikanth',
  'Prashanthi Sripathi',
  'D. Jyoti Prem',
  'Soumyadeep Sinha',
  'Dr. Sehba Samreen',
  'Manikanta Kesana',
  'Archana Chikatmarla',
  'Niya Glincy',
  'venk0tv',
  'Sriram VPM',
  'Nellutla Jyoti',
  'Swathi Y. PhD',
  'CV Krishna',
  'Umakanth Narayandas',
  'Hafsa Syeda',
  'Mohd Ansar',
  'Saif Fires'
];

const STORAGE_KEYS = {
  roster: 'class-monitor-roster',
  history: 'class-monitor-history'
};

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const center = canvas.width / 2;
const radius = center - 5;
const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899'];

let names = readRoster();
let rotation = 0;
let spinning = false;
let history = readHistory();

const rosterList = document.getElementById('rosterList');
const result = document.getElementById('result');
const spinButton = document.getElementById('spinButton');
const newStudentInput = document.getElementById('newStudentInput');
const fileInput = document.getElementById('fileInput');

function normalizeRoster(list) {
  return [...new Set(list
    .map((item) => String(item).trim())
    .filter(Boolean))];
}

function readRoster() {
  const saved = localStorage.getItem(STORAGE_KEYS.roster);
  if (!saved) return [...DEFAULT_ROSTER];
  try {
    const parsed = JSON.parse(saved);
    return normalizeRoster(Array.isArray(parsed) ? parsed : DEFAULT_ROSTER);
  } catch {
    return [...DEFAULT_ROSTER];
  }
}

function saveRoster() {
  localStorage.setItem(STORAGE_KEYS.roster, JSON.stringify(names));
}

function readHistory() {
  const saved = localStorage.getItem(STORAGE_KEYS.history);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function renderRoster() {
  if (!rosterList) return;

  if (names.length === 0) {
    rosterList.innerHTML = '<div class="empty-state">No students in the roster yet.</div>';
    spinButton.disabled = true;
    return;
  }

  spinButton.disabled = false;
  rosterList.innerHTML = names
    .map((name, index) => `
      <div class="roster-item">
        <span>${name}</span>
        <button class="remove-student-btn" data-index="${index}" aria-label="Remove ${name}">×</button>
      </div>
    `)
    .join('');

  document.querySelectorAll('.remove-student-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const idx = Number(button.dataset.index);
      names.splice(idx, 1);
      saveRoster();
      renderRoster();
    });
  });
}

function updateHistoryStats() {
  const totalSpins = document.getElementById('totalSpins');
  const uniqueWinners = document.getElementById('uniqueWinners');
  const mostWins = document.getElementById('mostWins');
  const historyList = document.getElementById('historyList');

  if (!totalSpins || !uniqueWinners || !mostWins || !historyList) return;

  totalSpins.textContent = String(history.length);

  const uniqueSet = new Set(history.map((entry) => entry.name));
  uniqueWinners.textContent = String(uniqueSet.size);

  const counts = {};
  history.forEach((entry) => {
    counts[entry.name] = (counts[entry.name] || 0) + 1;
  });

  const topWinner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  mostWins.textContent = topWinner ? `${topWinner[0]} (${topWinner[1]})` : '—';

  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-state">No winner history yet. Spin the wheel to begin.</div>';
    return;
  }

  historyList.innerHTML = history
    .slice()
    .reverse()
    .map((entry, index) => `
      <div class="history-item">
        <strong>#${history.length - index}</strong>
        <span>${entry.name}</span>
        <small>${new Date(entry.timestamp).toLocaleString()}</small>
      </div>
    `)
    .join('');
}

function addStudent(name) {
  const cleanName = String(name).trim();
  if (!cleanName) return;
  names.push(cleanName);
  saveRoster();
  renderRoster();
}

function clearRoster() {
  names = [];
  saveRoster();
  renderRoster();
  result.textContent = 'Roster cleared';
}

function restoreDefaultRoster() {
  names = [...DEFAULT_ROSTER];
  saveRoster();
  renderRoster();
  result.textContent = 'Default roster restored';
}

function exportRoster() {
  const csv = names.map((name) => `"${name.replace(/"/g, '""')}"`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'class-roster.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function importRosterFromCsv(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result || '';
    const imported = text
      .split(/\r?\n|,/)
      .map((line) => line.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);

    if (imported.length === 0) {
      result.textContent = 'No names found in CSV';
      return;
    }

    names = normalizeRoster(imported);
    saveRoster();
    renderRoster();
    result.textContent = 'Roster imported successfully';
  };
  reader.readAsText(file);
}

function drawWheel() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!names.length) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  const slice = (2 * Math.PI) / names.length;

  names.forEach((name, i) => {
    const startAngle = rotation + i * slice;
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startAngle + slice / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, radius - 18, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function spin() {
  if (spinning || names.length === 0) return;

  spinning = true;
  result.classList.remove('winner');
  result.textContent = '';
  spinButton.disabled = true;

  const slice = (2 * Math.PI) / names.length;
  const startRotation = rotation;
  const rotations = 6 + Math.random() * 4;
  const randomAngle = Math.random() * slice;
  const targetRotation = startRotation + rotations * 2 * Math.PI + randomAngle;
  const duration = 6000;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 5);

    rotation = startRotation + (targetRotation - startRotation) * easeOut;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
      return;
    }

    rotation = rotation % (2 * Math.PI);

    const pointerAngle = (3 * Math.PI / 2 - rotation) % (2 * Math.PI);
    const normalizedAngle = pointerAngle < 0 ? pointerAngle + 2 * Math.PI : pointerAngle;
    const winnerIndex = Math.floor(normalizedAngle / slice);
    const winner = names[winnerIndex] || names[0];

    result.textContent = `🎉 CLASS MONITOR: ${winner} 🎉`;
    result.classList.add('winner');

    history.push({ name: winner, timestamp: new Date().toISOString() });
    saveHistory();
    updateHistoryStats();

    spinning = false;
    spinButton.disabled = false;
  }

  requestAnimationFrame(animate);
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-button');
  const panels = document.querySelectorAll('.tab-content');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((btn) => btn.classList.toggle('active', btn === tab));
      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.id === tab.dataset.tab);
      });
    });
  });
}

function bindControls() {
  document.getElementById('spinButton').addEventListener('click', spin);

  document.getElementById('addStudentBtn').addEventListener('click', () => {
    addStudent(newStudentInput.value);
    newStudentInput.value = '';
    newStudentInput.focus();
  });

  newStudentInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      addStudent(newStudentInput.value);
      newStudentInput.value = '';
    }
  });

  document.getElementById('clearRosterBtn').addEventListener('click', () => {
    clearRoster();
  });

  document.getElementById('restoreDefaultBtn').addEventListener('click', () => {
    restoreDefaultRoster();
  });

  document.getElementById('exportBtn').addEventListener('click', exportRoster);

  document.getElementById('importBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (event) => {
    importRosterFromCsv(event.target.files[0]);
    fileInput.value = '';
  });

  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    history = [];
    saveHistory();
    updateHistoryStats();
  });
}

function initialize() {
  setupTabs();
  bindControls();
  renderRoster();
  updateHistoryStats();
  drawWheel();
}

initialize();
