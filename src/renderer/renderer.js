const REGULATION_PERIODS = ['1', '2', '3'];
const OVERTIME_PERIODS = ['OT', 'OT2', 'OT3', 'OT4'];
const OPPONENT_TAKEDOWN_TYPE = 'opponent_takedown';
const NEARFALL_US_TYPE = 'nearfall_us';
const NEARFALL_THEM_TYPE = 'nearfall_them';
const MAX_OT_PERIODS = 4;
const RESIZER_STORAGE_KEY = 'trojan-journal-left-panel-width';
const THEME_FORCE_DARK_KEY = 'trojan-journal-force-dark';
const MIN_LEFT_PANEL_WIDTH = 320;
const MIN_RIGHT_PANEL_WIDTH = 320;
const EVENT_TYPE_OPTIONS = [
  ['shot_attempt', 'Shot Attempt'],
  ['takedown', 'Takedown'],
  ['nearfall', 'Nearfall'],
  ['caution', 'Caution'],
  ['stalling', 'Stalling'],
  ['penalty', 'Penalty'],
  ['escape', 'Escape'],
  ['reversal', 'Reversal']
];

const state = {
  wrestlers: [],
  selectedWrestlerId: null,
  matches: [],
  selectedMatchId: null,
  editingEventId: null,
  editingWrestlerId: null,
  summaryCollapsedByMatchId: {},
  forceDarkTheme: false
};

const el = {
  themeToggle: document.getElementById('theme-toggle'),
  openWrestlerModalBtn: document.getElementById('open-wrestler-modal'),
  wrestlerForm: document.getElementById('wrestler-form'),
  wrestlerModal: document.getElementById('wrestler-modal'),
  wrestlerModalCancel: document.getElementById('wrestler-modal-cancel'),
  wrestlerEditModal: document.getElementById('wrestler-edit-modal'),
  wrestlerEditForm: document.getElementById('wrestler-edit-form'),
  wrestlerEditName: document.getElementById('wrestler-edit-name'),
  wrestlerEditModalCancel: document.getElementById('wrestler-edit-modal-cancel'),
  wrestlerList: document.getElementById('wrestler-list'),
  contentSplit: document.getElementById('content-split'),
  contentResizer: document.getElementById('content-resizer'),
  matchListSection: document.getElementById('match-list-section'),
  openMatchModalBtn: document.getElementById('open-match-modal'),
  matchForm: document.getElementById('match-form'),
  matchModal: document.getElementById('match-modal'),
  matchModalCancel: document.getElementById('match-modal-cancel'),
  deleteWrestlerBtn: document.getElementById('delete-wrestler'),
  exportBtn: document.getElementById('export-csv'),
  deleteMatchBtn: document.getElementById('delete-match'),
  eventLogSection: document.getElementById('event-log-section'),
  eventPeriodTables: document.getElementById('event-period-tables'),
  addOvertimeBtn: document.getElementById('add-overtime'),
  editModal: document.getElementById('event-edit-modal'),
  editForm: document.getElementById('event-edit-form'),
  editDeleteBtn: document.getElementById('event-edit-delete'),
  editCancelBtn: document.getElementById('event-edit-cancel'),
  summaryModal: document.getElementById('summary-modal'),
  summaryForm: document.getElementById('summary-form'),
  summaryTextarea: document.getElementById('summary-textarea'),
  summaryModalCancel: document.getElementById('summary-modal-cancel'),
  matchTableBody: document.querySelector('#match-table tbody'),
  selectedSummary: document.getElementById('selected-match-summary'),
  globalAnalytics: document.getElementById('global-analytics')
};

el.editPeriod = el.editForm.querySelector('select[name="period"]');
el.editType = el.editForm.querySelector('select[name="type"]');
el.editSide = el.editForm.querySelector('select[name="side"]');
el.editPoints = el.editForm.querySelector('input[name="points"]');
el.editNote = el.editForm.querySelector('input[name="note"]');

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

function isSystemDark() {
  return Boolean(systemDarkQuery.matches);
}

function isDarkModeActive() {
  return state.forceDarkTheme || isSystemDark();
}

function setThemeToggleIcon() {
  if (!el.themeToggle) return;
  const darkActive = isDarkModeActive();
  if (darkActive) {
    el.themeToggle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.5"></circle>
        <line x1="12" y1="2.5" x2="12" y2="5.5"></line>
        <line x1="12" y1="18.5" x2="12" y2="21.5"></line>
        <line x1="2.5" y1="12" x2="5.5" y2="12"></line>
        <line x1="18.5" y1="12" x2="21.5" y2="12"></line>
        <line x1="5.2" y1="5.2" x2="7.3" y2="7.3"></line>
        <line x1="16.7" y1="16.7" x2="18.8" y2="18.8"></line>
        <line x1="16.7" y1="7.3" x2="18.8" y2="5.2"></line>
        <line x1="5.2" y1="18.8" x2="7.3" y2="16.7"></line>
      </svg>
    `;
    el.themeToggle.title = state.forceDarkTheme ? 'Use system theme' : 'Dark mode follows system. Click to force dark mode.';
    el.themeToggle.setAttribute('aria-label', state.forceDarkTheme ? 'Use system theme' : 'Force dark mode');
  } else {
    el.themeToggle.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M14.5 3.5a8.5 8.5 0 1 0 6 14.5 8 8 0 1 1-6-14.5Z"></path>
      </svg>
    `;
    el.themeToggle.title = 'Force dark mode';
    el.themeToggle.setAttribute('aria-label', 'Force dark mode');
  }
}

function applyTheme() {
  const darkActive = isDarkModeActive();
  document.body.classList.toggle('theme-dark', darkActive);
  setThemeToggleIcon();
}

function initTheme() {
  state.forceDarkTheme = window.localStorage.getItem(THEME_FORCE_DARK_KEY) === '1';
  applyTheme();

  if (el.themeToggle) {
    el.themeToggle.addEventListener('click', () => {
      state.forceDarkTheme = !state.forceDarkTheme;
      if (state.forceDarkTheme) {
        window.localStorage.setItem(THEME_FORCE_DARK_KEY, '1');
      } else {
        window.localStorage.removeItem(THEME_FORCE_DARK_KEY);
      }
      applyTheme();
    });
  }

  systemDarkQuery.addEventListener('change', () => {
    if (!state.forceDarkTheme) {
      applyTheme();
    }
  });
}

function getSelectedWrestler() {
  return state.wrestlers.find((w) => w.id === state.selectedWrestlerId) || null;
}

function getMatchesForSelectedWrestler() {
  if (!state.selectedWrestlerId) return [];
  return state.matches.filter((m) => m.wrestlerId === state.selectedWrestlerId);
}

function isOvertimePeriod(period) {
  return OVERTIME_PERIODS.includes(period);
}

function supportsChoice(period) {
  return period === '2' || period === '3' || isOvertimePeriod(period);
}

function formatPeriodLabel(period) {
  if (period === 'OT') return 'OT';
  const match = String(period || '').match(/^OT(\d+)$/);
  if (match) return `OT ${match[1]}`;
  return String(period || '');
}

function csvEscape(value) {
  const str = String(value ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replaceAll('"', '""')}"`;
  }
  return str;
}

function filenamePart(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function formatDateDisplay(value) {
  const str = String(value || '').trim();
  if (!str) return '';
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return str;
  const [, year, month, day] = match;
  return `${month}/${day}/${year.slice(-2)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatInlineSummary(text) {
  const escaped = escapeHtml(text).replace(/\r?\n/g, '<br>');
  const withCode = escaped.replace(/`([^`]+?)`/g, '<code>$1</code>');
  const withLinks = withCode.replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const withBold = withLinks
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>');
  return withBold
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
}

function getMatchSummary(match) {
  return String(match.summary ?? match.notes ?? '').trim();
}

function renderSummaryHtml(summaryText) {
  const raw = String(summaryText || '').trim();
  if (!raw) return '<p class="summary-empty">None</p>';

  const lines = raw.split(/\r?\n/);
  const parts = [];
  let paragraph = [];
  let listType = null;

  const closeParagraph = () => {
    if (!paragraph.length) return;
    parts.push(`<p>${formatInlineSummary(paragraph.join('\n'))}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    parts.push(`</${listType}>`);
    listType = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (listType) {
        closeList();
      } else {
        paragraph.push('');
      }
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    const blockquoteMatch = trimmed.match(/^>\s+(.+)$/);
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);

    if (headingMatch) {
      closeParagraph();
      closeList();
      const level = Math.min(6, headingMatch[1].length);
      parts.push(`<h${level}>${formatInlineSummary(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (blockquoteMatch) {
      closeParagraph();
      closeList();
      parts.push(`<blockquote>${formatInlineSummary(blockquoteMatch[1])}</blockquote>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closeParagraph();
      closeList();
      parts.push('<hr>');
      continue;
    }

    if (unorderedMatch || orderedMatch) {
      closeParagraph();
      const nextType = unorderedMatch ? 'ul' : 'ol';
      const itemText = unorderedMatch ? unorderedMatch[1] : orderedMatch[1];
      if (listType !== nextType) {
        closeList();
        parts.push(`<${nextType}>`);
        listType = nextType;
      }
      parts.push(`<li>${formatInlineSummary(itemText)}</li>`);
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  closeParagraph();
  closeList();
  return parts.join('');
}

function boldValuesAfterColon(text) {
  return String(text || '')
    .split(' | ')
    .map((segment) => {
      const colonIdx = segment.indexOf(':');
      if (colonIdx === -1) return segment;
      const label = segment.slice(0, colonIdx + 1);
      const value = segment.slice(colonIdx + 1).trim();
      return `${label} <strong>${escapeHtml(value)}</strong>`;
    })
    .join(' | ');
}

function takeDownStats(events) {
  const attempts = events.filter((e) => isShotAttemptByUs(e)).length;
  const successes = events.filter((e) => isTakedownByUs(e)).length;
  const pct = attempts ? (successes / attempts) * 100 : 0;
  return { attempts, successes, pct };
}

function opponentTakeDownStats(events) {
  const scored = events.filter((e) => isTakedownByThem(e)).length;
  return { scored };
}

function getEventSide(event) {
  if (event.side === 'us' || event.side === 'them') return event.side;
  if (event.type === OPPONENT_TAKEDOWN_TYPE || event.type === NEARFALL_THEM_TYPE || event.type === 'escape_them') {
    return 'them';
  }
  return 'us';
}

function formatEventSide(event) {
  return getEventSide(event) === 'them' ? 'Them' : 'Us';
}

function formatEventType(event) {
  if (event.type === 'shot_attempt') return 'Shot Attempt';
  if (event.type === 'takedown') return 'Takedown';
  if (event.type === 'nearfall') return 'Nearfall';
  if (event.type === 'escape') return 'Escape';
  if (event.type === 'reversal') return 'Reversal';
  if (event.type === 'caution') return 'Caution';
  if (event.type === 'stalling') return 'Stalling';
  if (event.type === 'penalty') return 'Penalty';
  if (event.type === 'takedown_attempt') return event.successful === true ? 'Takedown' : 'Shot Attempt';
  if (event.type === OPPONENT_TAKEDOWN_TYPE) return 'Takedown';
  if (event.type === NEARFALL_US_TYPE || event.type === NEARFALL_THEM_TYPE) return 'Nearfall';
  if (event.type === 'escape_us' || event.type === 'escape_them') return 'Escape';
  return event.type.replaceAll('_', ' ');
}

function isShotAttemptByUs(event) {
  if (event.type === 'shot_attempt') return getEventSide(event) === 'us';
  if (event.type === 'takedown') return getEventSide(event) === 'us';
  if (event.type === 'takedown_attempt') return true;
  return false;
}

function isTakedownByUs(event) {
  if (event.type === 'takedown') return getEventSide(event) === 'us';
  if (event.type === 'takedown_attempt') return event.successful === true;
  return false;
}

function isTakedownByThem(event) {
  if (event.type === 'takedown') return getEventSide(event) === 'them';
  if (event.type === OPPONENT_TAKEDOWN_TYPE) return true;
  return false;
}

function getSelectedMatch() {
  const selected = state.matches.find((m) => m.id === state.selectedMatchId) || null;
  if (!selected) return null;
  if (state.selectedWrestlerId && selected.wrestlerId !== state.selectedWrestlerId) return null;
  return selected;
}

function getEditableType(event) {
  if (event.type === 'takedown_attempt') return event.successful === true ? 'takedown' : 'shot_attempt';
  if (event.type === OPPONENT_TAKEDOWN_TYPE) return 'takedown';
  if (event.type === NEARFALL_US_TYPE || event.type === NEARFALL_THEM_TYPE) return 'nearfall';
  if (event.type === 'escape_us' || event.type === 'escape_them') return 'escape';
  return EVENT_TYPE_OPTIONS.some(([value]) => value === event.type) ? event.type : 'shot_attempt';
}

function syncEditSideForType() {
  const isShotAttempt = el.editType.value === 'shot_attempt';
  el.editSide.disabled = isShotAttempt;
  if (isShotAttempt) el.editSide.value = 'us';
}

function openEditModal(eventId) {
  const match = getSelectedMatch();
  if (!match) return;
  const event = match.events.find((e) => e.id === eventId);
  if (!event) return;

  state.editingEventId = eventId;
  el.editPeriod.value = event.period;
  el.editType.value = getEditableType(event);
  el.editSide.value = getEventSide(event);
  el.editPoints.value = Number(event.points || 0);
  el.editNote.value = event.note || '';
  syncEditSideForType();
  el.editModal.classList.remove('is-hidden');
}

function closeEditModal() {
  state.editingEventId = null;
  el.editModal.classList.add('is-hidden');
}

function openMatchModal() {
  el.matchModal.classList.remove('is-hidden');
}

function closeMatchModal() {
  el.matchModal.classList.add('is-hidden');
  el.matchForm.reset();
}

function openWrestlerModal() {
  el.wrestlerModal.classList.remove('is-hidden');
}

function closeWrestlerModal() {
  el.wrestlerModal.classList.add('is-hidden');
  el.wrestlerForm.reset();
}

function openWrestlerEditModal(wrestlerId) {
  const wrestler = state.wrestlers.find((w) => w.id === wrestlerId);
  if (!wrestler) return;
  state.editingWrestlerId = wrestler.id;
  el.wrestlerEditName.value = wrestler.name;
  el.wrestlerEditModal.classList.remove('is-hidden');
}

function closeWrestlerEditModal() {
  state.editingWrestlerId = null;
  el.wrestlerEditModal.classList.add('is-hidden');
  el.wrestlerEditForm.reset();
}

function openSummaryModal() {
  const match = getSelectedMatch();
  if (!match) return;
  el.summaryTextarea.value = getMatchSummary(match);
  el.summaryModal.classList.remove('is-hidden');
}

function closeSummaryModal() {
  el.summaryModal.classList.add('is-hidden');
}

function clampLeftPanelWidth(width) {
  const splitRect = el.contentSplit.getBoundingClientRect();
  const resizerWidth = el.contentResizer.getBoundingClientRect().width || 12;
  const max = Math.max(MIN_LEFT_PANEL_WIDTH, splitRect.width - resizerWidth - MIN_RIGHT_PANEL_WIDTH);
  return Math.min(max, Math.max(MIN_LEFT_PANEL_WIDTH, width));
}

function applyLeftPanelWidth(width, persist = true) {
  if (!Number.isFinite(width)) return;
  const clamped = clampLeftPanelWidth(width);
  el.contentSplit.style.setProperty('--left-panel-width', `${clamped}px`);
  if (persist) {
    window.localStorage.setItem(RESIZER_STORAGE_KEY, String(Math.round(clamped)));
  }
}

function initContentResizer() {
  let drag = null;

  const savedRaw = window.localStorage.getItem(RESIZER_STORAGE_KEY);
  const savedWidth = Number(savedRaw);
  if (Number.isFinite(savedWidth) && savedWidth > 0) {
    applyLeftPanelWidth(savedWidth, false);
  }

  const onPointerMove = (event) => {
    if (!drag) return;
    const next = drag.startLeftWidth + (event.clientX - drag.startX);
    applyLeftPanelWidth(next);
  };

  const stopDrag = () => {
    if (!drag) return;
    el.contentResizer.classList.remove('dragging');
    drag = null;
  };

  el.contentResizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    drag = {
      startX: event.clientX,
      startLeftWidth: el.contentSplit.firstElementChild.getBoundingClientRect().width
    };
    el.contentResizer.classList.add('dragging');
    el.contentResizer.setPointerCapture(event.pointerId);
  });

  el.contentResizer.addEventListener('pointermove', onPointerMove);
  el.contentResizer.addEventListener('pointerup', stopDrag);
  el.contentResizer.addEventListener('pointercancel', stopDrag);
  window.addEventListener('resize', () => {
    const current = Number.parseFloat(el.contentSplit.style.getPropertyValue('--left-panel-width'));
    if (Number.isFinite(current) && current > 0) {
      applyLeftPanelWidth(current, false);
    }
  });
}

function isEscapeByUs(event) {
  if (event.type === 'escape') return getEventSide(event) === 'us';
  if (event.type === 'escape_us') return true;
  return false;
}

function isEscapeByThem(event) {
  if (event.type === 'escape') return getEventSide(event) === 'them';
  if (event.type === 'escape_them') return true;
  return false;
}

function isReversalByUs(event) {
  return event.type === 'reversal' && getEventSide(event) === 'us';
}

function isReversalByThem(event) {
  return event.type === 'reversal' && getEventSide(event) === 'them';
}

function calculateMatchMetrics(match) {
  const td = takeDownStats(match.events);
  const oppTd = opponentTakeDownStats(match.events);
  const escapeUsCount = match.events.filter((e) => isEscapeByUs(e)).length;
  const escapeThemCount = match.events.filter((e) => isEscapeByThem(e)).length;
  const reversalUsCount = match.events.filter((e) => isReversalByUs(e)).length;
  const reversalThemCount = match.events.filter((e) => isReversalByThem(e)).length;
  const cautionCount = match.events.filter((e) => e.type === 'caution').length;
  const penaltyCount = match.events.filter((e) => e.type === 'penalty').length;
  const stallingCount = match.events.filter((e) => e.type === 'stalling').length;
  const usPoints = match.events
    .filter((e) => getEventSide(e) === 'us')
    .reduce((sum, e) => sum + Number(e.points || 0), 0);
  const themPoints = match.events
    .filter((e) => getEventSide(e) === 'them')
    .reduce((sum, e) => sum + Number(e.points || 0), 0);
  const nearfallUsPoints = match.events
    .filter((e) => e.type === NEARFALL_US_TYPE || (e.type === 'nearfall' && getEventSide(e) === 'us'))
    .reduce((sum, e) => sum + Number(e.points || 0), 0);

  const nearfallThemPoints = match.events
    .filter((e) => e.type === NEARFALL_THEM_TYPE || (e.type === 'nearfall' && getEventSide(e) === 'them'))
    .reduce((sum, e) => sum + Number(e.points || 0), 0);

  const penaltyRelatedPoints = match.events
    .filter((e) => ['caution', 'stalling', 'penalty'].includes(e.type))
    .reduce((sum, e) => sum + Number(e.points || 0), 0);

  const totalPoints = match.events.reduce((sum, e) => sum + Number(e.points || 0), 0);

  return {
    tdAttempts: td.attempts,
    tdSuccesses: td.successes,
    tdPct: td.pct,
    tdAgainst: oppTd.scored,
    escapeUsCount,
    escapeThemCount,
    reversalUsCount,
    reversalThemCount,
    cautionCount,
    penaltyCount,
    stallingCount,
    usPoints,
    themPoints,
    nearfallUsPoints,
    nearfallThemPoints,
    nearfallPointsTotal: nearfallUsPoints + nearfallThemPoints,
    penaltyRelatedPoints,
    totalPoints
  };
}

function buildPeriodHeading(match, period) {
  const heading = document.createElement('div');
  heading.className = 'period-group-heading';

  const title = document.createElement('span');
  title.textContent = `Period ${formatPeriodLabel(period)}`;
  heading.appendChild(title);
  const actions = document.createElement('div');
  actions.className = 'period-heading-actions';
  let hasActions = false;

  if (supportsChoice(period)) {
    const label = document.createElement('label');
    label.className = 'period-choice-label';
    label.textContent = 'Choice';

    const select = document.createElement('select');
    select.className = 'period-choice-select';
    const options = [
      ['na', 'N/A'],
      ['defer', 'Defer'],
      ['top', 'Top'],
      ['bottom', 'Bottom'],
      ['neutral', 'Neutral']
    ];
    for (const [value, text] of options) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    }
    select.value = match.periodChoices[period] || 'na';

    select.addEventListener('change', async () => {
      match.periodChoices[period] = select.value;
      await persist();
    });

    label.appendChild(select);
    actions.appendChild(label);
    hasActions = true;
  }

  if (isOvertimePeriod(period)) {
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-ot-btn ghost-btn';
    removeBtn.textContent = 'Remove OT';
    removeBtn.addEventListener('click', async () => {
      const shouldRemove = window.confirm(`Remove ${formatPeriodLabel(period)} period and all events in it?`);
      if (!shouldRemove) return;

      match.events = match.events.filter((e) => e.period !== period);
      delete match.periodChoices[period];
      match.extraPeriods = (match.extraPeriods || []).filter((p) => p !== period);
      await persist();
      render();
    });
    actions.appendChild(removeBtn);
    hasActions = true;
  }

  if (hasActions) {
    heading.appendChild(actions);
  }

  return heading;
}

function buildEventEntryRow(match, period) {
  const row = document.createElement('tr');
  row.className = 'event-entry-row';

  const formCell = document.createElement('td');
  formCell.colSpan = 5;
  const formGrid = document.createElement('div');
  formGrid.className = 'event-entry-form';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'event-entry-select';
  for (const [value, label] of EVENT_TYPE_OPTIONS) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  }

  const sideSelect = document.createElement('select');
  sideSelect.className = 'event-entry-select';
  [
    ['us', 'Us'],
    ['them', 'Them']
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sideSelect.appendChild(option);
  });

  const pointsInput = document.createElement('input');
  pointsInput.type = 'number';
  pointsInput.min = '0';
  pointsInput.max = '5';
  pointsInput.step = '1';
  pointsInput.value = '0';
  pointsInput.className = 'event-entry-points';

  const noteInput = document.createElement('input');
  noteInput.type = 'text';
  noteInput.placeholder = 'Shot setup, position, mistake, etc.';
  noteInput.className = 'event-entry-note';

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'event-entry-add';
  addBtn.textContent = 'Add';

  const syncSideForType = () => {
    const isShotAttempt = typeSelect.value === 'shot_attempt' || typeSelect.value === 'takedown_attempt';
    sideSelect.disabled = isShotAttempt;
    if (isShotAttempt) sideSelect.value = 'us';
  };
  syncSideForType();
  typeSelect.addEventListener('change', syncSideForType);

  const submitInlineEvent = async () => {
    const type = typeSelect.value;
    const side = sideSelect.value || 'us';
    const newEvent = {
      id: uid(),
      period,
      type,
      side,
      points: Number(pointsInput.value || 0),
      note: String(noteInput.value || '').trim(),
      createdAt: new Date().toISOString()
    };

    match.events.push(newEvent);
    await persist();
    render();
  };

  addBtn.addEventListener('click', submitInlineEvent);
  noteInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await submitInlineEvent();
    }
  });

  formGrid.appendChild(typeSelect);
  formGrid.appendChild(sideSelect);
  formGrid.appendChild(pointsInput);
  formGrid.appendChild(noteInput);
  formGrid.appendChild(addBtn);
  formCell.appendChild(formGrid);
  row.appendChild(formCell);
  return row;
}

function renderMatchTable() {
  el.matchTableBody.innerHTML = '';
  const wrestler = getSelectedWrestler();
  const hasWrestler = Boolean(wrestler);
  el.matchListSection.classList.toggle('is-hidden', !hasWrestler);
  if (!hasWrestler) return;

  const sorted = [...getMatchesForSelectedWrestler()].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (sorted.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'table-empty-row';
    emptyRow.innerHTML = '<td colspan="7">No matches logged yet for this wrestler.</td>';
    el.matchTableBody.appendChild(emptyRow);
    return;
  }

  for (const match of sorted) {
    const metrics = calculateMatchMetrics(match);
    const row = document.createElement('tr');
    if (match.id === state.selectedMatchId) row.classList.add('active');

    row.innerHTML = `
      <td>${formatDateDisplay(match.date)}</td>
      <td>${match.opponent}</td>
      <td>${match.result || '-'} ${metrics.usPoints}-${metrics.themPoints}</td>
      <td>${metrics.tdPct.toFixed(1)}% (${metrics.tdSuccesses}/${metrics.tdAttempts})</td>
      <td>${metrics.tdSuccesses}/${metrics.tdAgainst}</td>
      <td>${metrics.nearfallUsPoints}/${metrics.nearfallThemPoints}</td>
      <td>${metrics.penaltyCount}/${metrics.cautionCount}/${metrics.stallingCount}</td>
    `;

    row.addEventListener('click', () => {
      state.selectedMatchId = state.selectedMatchId === match.id ? null : match.id;
      render();
    });

    el.matchTableBody.appendChild(row);
  }
}

function renderSelectedMatch() {
  const match = getSelectedMatch();
  const wrestler = getSelectedWrestler();

  if (!wrestler) {
    el.selectedSummary.classList.add('is-placeholder');
    el.selectedSummary.innerHTML = `
      <strong class="ink-highlight">No Match Selected</strong>
      <p>Select a wrestler and match to view events.</p>
    `;
    el.eventLogSection.classList.add('is-hidden');
    el.exportBtn.disabled = true;
    el.openMatchModalBtn.disabled = true;
    el.addOvertimeBtn.disabled = true;
    el.deleteMatchBtn.disabled = true;
    closeSummaryModal();
    el.eventPeriodTables.innerHTML = '';
    return;
  }

  if (!match) {
    el.selectedSummary.classList.add('is-placeholder');
    el.selectedSummary.innerHTML = `
      <strong class="ink-highlight">No Match Selected</strong>
      <p>Select a match from the list or add a new one to start logging period events.</p>
    `;
    el.eventLogSection.classList.add('is-hidden');
    el.exportBtn.disabled = true;
    el.openMatchModalBtn.disabled = false;
    el.addOvertimeBtn.disabled = true;
    el.deleteMatchBtn.disabled = true;
    closeSummaryModal();
    el.eventPeriodTables.innerHTML = '';
    return;
  }

  el.selectedSummary.classList.remove('is-placeholder');
  el.eventLogSection.classList.remove('is-hidden');
  el.exportBtn.disabled = false;
  el.openMatchModalBtn.disabled = false;
  el.deleteMatchBtn.disabled = false;

  const metrics = calculateMatchMetrics(match);
  if (!match.periodChoices || typeof match.periodChoices !== 'object') {
    match.periodChoices = {};
  }
  if (!Array.isArray(match.extraPeriods)) {
    match.extraPeriods = [];
  }
  const disciplineDetails = [];
  if (metrics.cautionCount > 0) disciplineDetails.push(`Cautions: ${metrics.cautionCount}`);
  if (metrics.penaltyCount > 0) disciplineDetails.push(`Penalties: ${metrics.penaltyCount}`);
  if (metrics.stallingCount > 0) disciplineDetails.push(`Stalling: ${metrics.stallingCount}`);
  const disciplineSuffix = disciplineDetails.length ? ` | ${disciplineDetails.join(' | ')}` : '';
  const matchMetaLine = `${match.eventName || 'No event name'}${match.weightClass ? ` | ${match.weightClass}` : ''} | Result: ${match.result || '-'} | Score: ${metrics.usPoints}-${metrics.themPoints}`;
  const matchStatsLine = `TD Scored: ${metrics.tdSuccesses}/${metrics.tdAttempts} (${metrics.tdPct.toFixed(1)}%) | TD Against: ${metrics.tdAgainst} | Escapes U/T: ${metrics.escapeUsCount}/${metrics.escapeThemCount} | Reversals U/T: ${metrics.reversalUsCount}/${metrics.reversalThemCount} | Nearfall U/T: ${metrics.nearfallUsPoints}/${metrics.nearfallThemPoints}${disciplineSuffix}`;
  const summaryText = getMatchSummary(match);
  const isSummaryEmpty = !summaryText;
  const isSummaryCollapsed = Boolean(state.summaryCollapsedByMatchId[match.id]);
  const showHeaderEdit = !isSummaryCollapsed && !isSummaryEmpty;
  const summaryBody = isSummaryCollapsed
    ? ''
    : isSummaryEmpty
      ? `
        <div class="match-summary-empty">
          <p class="summary-empty">No summary yet.</p>
          <button type="button" class="ghost-btn match-summary-edit-btn" data-action="edit-summary">Edit</button>
        </div>
      `
      : `
        ${renderSummaryHtml(summaryText)}
      `;
  el.selectedSummary.innerHTML = `
    <strong class="ink-highlight">${formatDateDisplay(match.date)} | ${wrestler.name} vs ${match.opponent}</strong>
    <p>${boldValuesAfterColon(matchMetaLine)}</p>
    <p>${boldValuesAfterColon(matchStatsLine)}</p>
    <div class="match-summary-block${isSummaryCollapsed ? ' is-collapsed' : ''}">
      <div class="match-summary-header">
        <div class="match-summary-heading">
          <p class="match-summary-title">Match Summary</p>
          <button
            type="button"
            class="ghost-btn summary-toggle-btn"
            data-action="toggle-summary"
            aria-label="${isSummaryCollapsed ? 'Show summary' : 'Collapse summary'}"
            title="${isSummaryCollapsed ? 'Show summary' : 'Collapse summary'}"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <path d="${isSummaryCollapsed ? 'M5 8l5 5 5-5' : 'M5 12l5-5 5 5'}" />
            </svg>
          </button>
        </div>
        ${showHeaderEdit ? '<button type="button" class="ghost-btn match-summary-edit-btn" data-action="edit-summary">Edit</button>' : ''}
      </div>
      ${summaryBody}
    </div>
  `;

  const eventPeriods = new Set(match.events.map((e) => e.period));
  const choicePeriods = new Set(Object.keys(match.periodChoices || {}));
  const explicitOvertimePeriods = new Set(match.extraPeriods || []);
  const visiblePeriods = [...REGULATION_PERIODS];

  for (const overtimePeriod of OVERTIME_PERIODS) {
    if (
      eventPeriods.has(overtimePeriod) ||
      choicePeriods.has(overtimePeriod) ||
      explicitOvertimePeriods.has(overtimePeriod)
    ) {
      visiblePeriods.push(overtimePeriod);
    }
  }

  el.eventPeriodTables.innerHTML = '';
  for (const period of visiblePeriods) {
    const periodSection = document.createElement('section');
    periodSection.className = 'period-table';

    const heading = buildPeriodHeading(match, period);
    periodSection.appendChild(heading);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap';
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Type</th>
          <th>Us/Them</th>
          <th>Points</th>
          <th>Note</th>
          <th class="event-action-col"></th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement('tbody');

    const eventsInPeriod = match.events
      .filter((e) => e.period === period)
      .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

    if (eventsInPeriod.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'period-empty-row';
      emptyRow.innerHTML = `<td colspan="5">No events logged for this period yet.</td>`;
      tbody.appendChild(emptyRow);
    } else {
    for (const event of eventsInPeriod) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatEventType(event)}</td>
        <td>${formatEventSide(event)}</td>
        <td>${event.points}</td>
        <td>${event.note || '-'}</td>
      `;
      const actionCell = document.createElement('td');
      actionCell.className = 'event-action-cell';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'event-edit-btn';
      editBtn.title = 'Edit event';
      editBtn.setAttribute('aria-label', 'Edit event');
      editBtn.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-2.8Z" />
        </svg>
      `;
      editBtn.addEventListener('click', () => openEditModal(event.id));
      actionCell.appendChild(editBtn);
      row.appendChild(actionCell);
      tbody.appendChild(row);
    }
    }

    tbody.appendChild(buildEventEntryRow(match, period));
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    periodSection.appendChild(tableWrap);
    el.eventPeriodTables.appendChild(periodSection);
  }

  const activeOtPeriods = new Set(
    [...match.events.map((e) => e.period), ...Object.keys(match.periodChoices || {}), ...(match.extraPeriods || [])].filter((p) =>
      isOvertimePeriod(p)
    )
  );
  const canAddOt = activeOtPeriods.size < MAX_OT_PERIODS;
  el.addOvertimeBtn.disabled = !canAddOt;
  el.addOvertimeBtn.textContent = 'Add OT';
}

function renderGlobalAnalytics() {
  const scopedMatches = getMatchesForSelectedWrestler();
  const allEvents = scopedMatches.flatMap((m) => m.events);
  const allTd = takeDownStats(allEvents);
  const allOppTd = opponentTakeDownStats(allEvents);
  const nearfallUsPoints = allEvents
    .filter((e) => e.type === NEARFALL_US_TYPE || (e.type === 'nearfall' && getEventSide(e) === 'us'))
    .reduce((sum, e) => sum + Number(e.points || 0), 0);
  const nearfallThemPoints = allEvents
    .filter((e) => e.type === NEARFALL_THEM_TYPE || (e.type === 'nearfall' && getEventSide(e) === 'them'))
    .reduce((sum, e) => sum + Number(e.points || 0), 0);
  const wins = scopedMatches.filter((m) => m.result === 'W').length;
  const losses = scopedMatches.filter((m) => m.result === 'L').length;
  const escapeUsCount = allEvents.filter((e) => isEscapeByUs(e)).length;
  const downChoiceCount = scopedMatches.reduce((total, m) => {
    const choices = m.periodChoices && typeof m.periodChoices === 'object' ? Object.values(m.periodChoices) : [];
    return total + choices.filter((choice) => choice === 'bottom').length;
  }, 0);
  const escapeOpportunities = allOppTd.scored + downChoiceCount;
  const escapePct = escapeOpportunities ? (escapeUsCount / escapeOpportunities) * 100 : 0;

  const wrestler = getSelectedWrestler();
  if (!wrestler) {
    el.deleteWrestlerBtn.disabled = true;
    el.globalAnalytics.classList.add('is-placeholder');
    el.globalAnalytics.innerHTML = `
      <strong class="ink-highlight">No Wrestler Selected</strong>
      <p>Select a wrestler from the sidebar to view analytics.</p>
    `;
    return;
  }

  el.deleteWrestlerBtn.disabled = false;
  el.globalAnalytics.classList.remove('is-placeholder');
  el.globalAnalytics.innerHTML = `
    <strong class="ink-highlight">${wrestler.name}</strong>
    <p>${boldValuesAfterColon(`Record: ${wins}-${losses}`)}</p>
    <p>${boldValuesAfterColon(`Takedown %: ${allTd.pct.toFixed(1)}% (${allTd.successes}/${allTd.attempts})`)}</p>
    <p>${boldValuesAfterColon(`Takedowns Given Up: ${allOppTd.scored}`)}</p>
    <p>${boldValuesAfterColon(`Escape %: ${escapePct.toFixed(1)}% (${escapeUsCount}/${escapeOpportunities})`)}</p>
    <p>${boldValuesAfterColon(`Nearfall Pts Us/Them: ${nearfallUsPoints}/${nearfallThemPoints}`)}</p>
    <p>${boldValuesAfterColon(`Nearfall Pts Total: ${nearfallUsPoints + nearfallThemPoints}`)}</p>
  `;
}

async function persist() {
  await window.journalApi.save({
    matches: state.matches,
    wrestlers: state.wrestlers
  });
}

function toCsvFiles(matches) {
  const dataset = Array.isArray(matches) ? matches : [];
  const headers = [
    'period',
    'period_choice',
    'event_number_in_period',
    'event_type',
    'us_them',
    'points',
    'event_note',
    'created_at',
    'match_summary'
  ];

  const periodOrder = new Map([...REGULATION_PERIODS, ...OVERTIME_PERIODS].map((p, i) => [p, i]));
  const rows = [];
  for (const m of dataset) {
    const sortedEvents = [...(Array.isArray(m.events) ? m.events : [])].sort((a, b) => {
      const aKey = periodOrder.has(a.period) ? periodOrder.get(a.period) : Number.MAX_SAFE_INTEGER;
      const bKey = periodOrder.has(b.period) ? periodOrder.get(b.period) : Number.MAX_SAFE_INTEGER;
      if (aKey !== bKey) return aKey - bKey;
      return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    });

    const periodCounts = new Map();
    for (const e of sortedEvents) {
      const current = (periodCounts.get(e.period) || 0) + 1;
      periodCounts.set(e.period, current);
      rows.push([
        e.period,
        m.periodChoices?.[e.period] || '',
        current,
        formatEventType(e),
        formatEventSide(e),
        e.points,
        e.note,
        e.createdAt,
        getMatchSummary(m)
      ]);
    }
  }

  const build = (headers, rows) => [
    headers.map(csvEscape).join(','),
    ...rows.map((r) => r.map(csvEscape).join(','))
  ].join('\n');

  const single = dataset[0] || null;
  const datePart = filenamePart(single?.date) || 'no-date';
  const opponentPart = filenamePart(single?.opponent) || 'opponent';
  const csvName = `selected_match_period_events_${datePart}_${opponentPart}.csv`;

  return {
    [csvName]: build(headers, rows)
  };
}

function render() {
  renderWrestlerList();
  renderMatchTable();
  renderSelectedMatch();
  renderGlobalAnalytics();
}

async function renameWrestler(wrestlerId) {
  openWrestlerEditModal(wrestlerId);
}

function renderWrestlerList() {
  el.wrestlerList.innerHTML = '';
  const visible = state.wrestlers;

  for (const wrestler of visible) {
    const li = document.createElement('li');
    li.className = 'wrestler-row';
    if (wrestler.id === state.selectedWrestlerId) li.classList.add('active');

    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'wrestler-item';
    selectBtn.dataset.action = 'select-wrestler';
    selectBtn.dataset.wrestlerId = wrestler.id;
    selectBtn.textContent = wrestler.name;

    const actions = document.createElement('div');
    actions.className = 'wrestler-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'event-edit-btn wrestler-edit-btn';
    editBtn.dataset.action = 'rename-wrestler';
    editBtn.dataset.wrestlerId = wrestler.id;
    editBtn.title = 'Rename wrestler';
    editBtn.setAttribute('aria-label', 'Rename wrestler');
    editBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25Zm17.71-10.04a1 1 0 0 0 0-1.41l-2.5-2.5a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75 2.12-2.8Z" />
      </svg>
    `;

    actions.appendChild(editBtn);
    li.appendChild(selectBtn);
    li.appendChild(actions);
    el.wrestlerList.appendChild(li);
  }
}

el.wrestlerList.addEventListener('click', async (event) => {
  const renameBtn = event.target.closest('button[data-action="rename-wrestler"]');
  if (renameBtn) {
    event.preventDefault();
    const wrestlerId = renameBtn.dataset.wrestlerId;
    if (wrestlerId) await renameWrestler(wrestlerId);
    return;
  }

  const selectBtn = event.target.closest('button[data-action="select-wrestler"]');
  if (!selectBtn) return;
  const wrestlerId = selectBtn.dataset.wrestlerId;
  if (!wrestlerId) return;

  if (state.selectedWrestlerId === wrestlerId) {
    state.selectedWrestlerId = null;
    state.selectedMatchId = null;
    render();
    return;
  }

  state.selectedWrestlerId = wrestlerId;
  const scoped = getMatchesForSelectedWrestler();
  state.selectedMatchId = scoped.find((m) => m.id === state.selectedMatchId)?.id || scoped[0]?.id || null;
  render();
});

el.matchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(el.matchForm);
  const wrestler = getSelectedWrestler();
  if (!wrestler) return;

  const match = {
    id: uid(),
    date: fd.get('date'),
    wrestlerId: wrestler.id,
    wrestler: wrestler.name,
    opponent: String(fd.get('opponent') || '').trim(),
    weightClass: String(fd.get('weightClass') || '').trim(),
    eventName: String(fd.get('eventName') || '').trim(),
    result: fd.get('result') || '',
    summary: '',
    periodChoices: {},
    extraPeriods: [],
    events: []
  };

  state.matches.push(match);
  state.selectedMatchId = match.id;

  await persist();
  closeMatchModal();
  render();
});

el.openMatchModalBtn.addEventListener('click', openMatchModal);
el.matchModalCancel.addEventListener('click', closeMatchModal);
el.matchModal.addEventListener('click', (event) => {
  if (event.target === el.matchModal) {
    closeMatchModal();
  }
});
el.openWrestlerModalBtn.addEventListener('click', openWrestlerModal);
el.wrestlerModalCancel.addEventListener('click', closeWrestlerModal);
el.wrestlerModal.addEventListener('click', (event) => {
  if (event.target === el.wrestlerModal) {
    closeWrestlerModal();
  }
});
el.wrestlerEditModalCancel.addEventListener('click', closeWrestlerEditModal);
el.wrestlerEditModal.addEventListener('click', (event) => {
  if (event.target === el.wrestlerEditModal) {
    closeWrestlerEditModal();
  }
});
el.summaryModalCancel.addEventListener('click', closeSummaryModal);
el.summaryModal.addEventListener('click', (event) => {
  if (event.target === el.summaryModal) {
    closeSummaryModal();
  }
});

el.wrestlerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(el.wrestlerForm);
  const raw = String(fd.get('name') || '').trim();
  if (!raw) return;

  const existing = state.wrestlers.find((w) => w.name.toLowerCase() === raw.toLowerCase());
  if (existing) {
    state.selectedWrestlerId = existing.id;
    closeWrestlerModal();
    render();
    return;
  }

  const wrestler = { id: uid(), name: raw };
  state.wrestlers.push(wrestler);
  state.selectedWrestlerId = wrestler.id;
  state.selectedMatchId = null;
  await persist();
  closeWrestlerModal();
  render();
});

el.wrestlerEditForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const wrestlerId = state.editingWrestlerId;
  if (!wrestlerId) return;
  const wrestler = state.wrestlers.find((w) => w.id === wrestlerId);
  if (!wrestler) return;

  const nextName = String(el.wrestlerEditName.value || '').trim();
  if (!nextName) return;
  const dup = state.wrestlers.find((w) => w.id !== wrestler.id && w.name.toLowerCase() === nextName.toLowerCase());
  if (dup) {
    window.alert('A wrestler with that name already exists.');
    return;
  }

  wrestler.name = nextName;
  for (const m of state.matches) {
    if (m.wrestlerId === wrestler.id) m.wrestler = nextName;
  }
  await persist();
  closeWrestlerEditModal();
  render();
});

el.selectedSummary.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-action="toggle-summary"]');
  if (toggle) {
    const match = getSelectedMatch();
    if (!match) return;
    state.summaryCollapsedByMatchId[match.id] = !Boolean(state.summaryCollapsedByMatchId[match.id]);
    renderSelectedMatch();
    return;
  }

  const target = event.target.closest('[data-action="edit-summary"]');
  if (!target) return;
  openSummaryModal();
});

el.summaryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const match = getSelectedMatch();
  if (!match) return;

  match.summary = String(el.summaryTextarea.value || '');
  await persist();
  closeSummaryModal();
  render();
});

el.exportBtn.addEventListener('click', async () => {
  const selectedMatch = state.matches.find((m) => m.id === state.selectedMatchId);
  if (!selectedMatch) return;

  const files = toCsvFiles([selectedMatch]);
  const result = await window.journalApi.exportCsv(files);
  if (!result.canceled) {
    alert(`Exported ${result.files.join(', ')} to:\n${result.folder}`);
  }
});

el.deleteMatchBtn.addEventListener('click', async () => {
  const match = state.matches.find((m) => m.id === state.selectedMatchId);
  if (!match) return;

  const shouldDelete = window.confirm(
    `Are you sure you want to delete this match?\n${match.date || '(no date)'}: ${match.wrestler} vs ${match.opponent}\nThis cannot be undone.`
  );

  if (!shouldDelete) return;

  state.matches = state.matches.filter((m) => m.id !== match.id);
  state.selectedMatchId = state.matches[0]?.id ?? null;

  await persist();
  render();
});

el.deleteWrestlerBtn.addEventListener('click', async () => {
  const wrestler = getSelectedWrestler();
  if (!wrestler) return;

  const ownedMatches = state.matches.filter((m) => m.wrestlerId === wrestler.id);
  const shouldDelete = window.confirm(
    `Delete wrestler "${wrestler.name}" and ${ownedMatches.length} match(es)?\nThis cannot be undone.`
  );
  if (!shouldDelete) return;

  state.matches = state.matches.filter((m) => m.wrestlerId !== wrestler.id);
  state.wrestlers = state.wrestlers.filter((w) => w.id !== wrestler.id);
  state.selectedWrestlerId = null;
  state.selectedMatchId = null;

  await persist();
  render();
});

el.addOvertimeBtn.addEventListener('click', async () => {
  const match = state.matches.find((m) => m.id === state.selectedMatchId);
  if (!match) return;
  if (!Array.isArray(match.extraPeriods)) match.extraPeriods = [];

  const activePeriods = new Set([
    ...(match.extraPeriods || []),
    ...match.events.map((e) => e.period),
    ...Object.keys(match.periodChoices || {})
  ]);
  const nextOt = OVERTIME_PERIODS.find((period) => !activePeriods.has(period));
  if (!nextOt) return;
  match.extraPeriods.push(nextOt);
  await persist();
  render();
});

el.editType.addEventListener('change', syncEditSideForType);
el.editDeleteBtn.addEventListener('click', async () => {
  const match = getSelectedMatch();
  if (!match || !state.editingEventId) return;
  const target = match.events.find((e) => e.id === state.editingEventId);
  if (!target) return;

  const shouldDelete = window.confirm(
    `Delete this event?\nPeriod ${target.period} | ${formatEventType(target)} | ${formatEventSide(target)} | ${target.points} pt(s)\nThis cannot be undone.`
  );
  if (!shouldDelete) return;

  match.events = match.events.filter((e) => e.id !== target.id);
  await persist();
  closeEditModal();
  render();
});
el.editCancelBtn.addEventListener('click', closeEditModal);
el.editModal.addEventListener('click', (event) => {
  if (event.target === el.editModal) {
    closeEditModal();
  }
});

el.editForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const match = getSelectedMatch();
  if (!match || !state.editingEventId) return;
  const target = match.events.find((e) => e.id === state.editingEventId);
  if (!target) return;

  target.period = el.editPeriod.value;
  target.type = el.editType.value;
  target.side = el.editSide.value;
  target.points = Number(el.editPoints.value || 0);
  target.note = String(el.editNote.value || '').trim();
  if (target.type === 'shot_attempt') target.side = 'us';

  await persist();
  closeEditModal();
  render();
});

async function init() {
  const loaded = await window.journalApi.load();
  state.matches = Array.isArray(loaded.matches) ? loaded.matches : [];
  state.wrestlers = Array.isArray(loaded.wrestlers) ? loaded.wrestlers : [];
  let didMigrate = !Array.isArray(loaded.wrestlers);

  // Backfill wrestler records/ids for older saved data.
  const byId = new Map();
  const byName = new Map();
  for (const wrestler of state.wrestlers) {
    if (!wrestler || typeof wrestler !== 'object') continue;
    if (!wrestler.id) {
      wrestler.id = uid();
      didMigrate = true;
    }
    wrestler.name = String(wrestler.name || '').trim() || 'Unknown Wrestler';
    byId.set(wrestler.id, wrestler);
    byName.set(wrestler.name.toLowerCase(), wrestler);
  }

  for (const match of state.matches) {
    const name = String(match.wrestler || '').trim() || 'Unknown Wrestler';
    const key = name.toLowerCase();
    let wrestler = null;

    if (match.wrestlerId) {
      wrestler = byId.get(match.wrestlerId) || null;
    }

    if (!wrestler) {
      wrestler = byName.get(key) || null;
    }

    if (!wrestler) {
      wrestler = {
        id: match.wrestlerId || uid(),
        name
      };
      state.wrestlers.push(wrestler);
      byId.set(wrestler.id, wrestler);
      byName.set(wrestler.name.toLowerCase(), wrestler);
      didMigrate = true;
    }

    if (match.wrestlerId !== wrestler.id) {
      match.wrestlerId = wrestler.id;
      didMigrate = true;
    }
    if (match.wrestler !== wrestler.name) {
      match.wrestler = wrestler.name;
      didMigrate = true;
    }
  }

  // Backfill fields required by current UI logic for older saved data.
  for (const match of state.matches) {
    if (!match.periodChoices || typeof match.periodChoices !== 'object') {
      match.periodChoices = {};
      didMigrate = true;
    }
    if (!Array.isArray(match.extraPeriods)) {
      match.extraPeriods = [];
      didMigrate = true;
    }
    if (!Array.isArray(match.events)) {
      match.events = [];
      didMigrate = true;
      continue;
    }
    for (const event of match.events) {
      if (!event.id) {
        event.id = uid();
        didMigrate = true;
      }
      if (!event.createdAt) {
        event.createdAt = new Date().toISOString();
        didMigrate = true;
      }
      if (!event.period) {
        event.period = '1';
        didMigrate = true;
      }
      if (!Number.isFinite(Number(event.points))) {
        event.points = 0;
        didMigrate = true;
      }
      if (event.type === 'shot_attempt' && !event.side) {
        event.side = 'us';
        didMigrate = true;
      }
    }
  }

  state.selectedWrestlerId = null;
  state.selectedMatchId = null;
  if (didMigrate) {
    await persist();
  }
  render();
}
initTheme();
init();
initContentResizer();
