// Leonida Platinum — tracker logic for the GTA 6 trophy guide.
// Plain ES module, no framework, no network at runtime: the only fetch is
// the guide's own data file (data/trophies.json), and the only links the
// app ever renders come from that data. Progress lives in localStorage
// under one key and never leaves the browser.

const DATA_URL = 'data/trophies.json';
const STORE_KEY = 'gta6-trophy-guide-v1';
const TOTAL = 55;

const GRADE_DOT = {
  platinum: '#7fd4ff',
  gold: '#d4af5a',
  silver: '#c3c9cf',
  bronze: '#b9784c',
};

const STAGES = [
  { n: 0, title: 'Before you start', blurb: 'Spoiler mode on, save discipline first: a manual save at the start of every chapter, plus one untouched save from just before the final mission. 15 manual slots, no mission replay, no New Game Plus — and cheats off on the trophy save.' },
  { n: 1, title: 'Chapter 1', blurb: 'Gone Fishing through to Just Like Paradise, then Paradise Lost at the chapter\u2019s end. Lucia\u2019s balcony meditation (Positive Mental Attitude) — do it now, before Chapter 1 ends. Beat Cal at fishing and finish an arcade game while you are here.' },
  { n: 2, title: 'Chapter 2', blurb: 'Chapter trophy, and from here Jason and Lucia are both playable, so partner trophies unlock. Kingpin Bowling, garages open through Daily Driver, Scooter Bros through Moses. Start WAiNK scans, vehicle discovery and meditation spots with your partner.' },
  { n: 3, title: 'Chapter 3', blurb: 'Chapter trophy. The Snap Gun from Yasmani\u2019s Jewelry Jobs opens jewelry-store robberies. Race Against Yago the moment it appears — it is time-sensitive. Rob three shops with your partner for Retail Therapy.' },
  { n: 4, title: 'Chapter 4', blurb: 'Chapter trophy. Bank vaults arrive near the end through That\u2019s Where The Money Is — five vaults for Maximum Withdrawal, and the escape earns Hot Together. Rob an armored truck and one illegal operation from each gang.' },
  { n: 5, title: 'Side stories', blurb: 'The six side-story finales: Andy, Kenton, Billy, Randy, Tyrone and Bret. All stay open after the credits. Andy, Billy and Tyrone do NOT count toward Strangers & Freaks — they have their own trophies.' },
  { n: 6, title: '100% grind', blurb: 'The post-story checklist: 300 stunts, 70 of 80 Challenges, 200 of 277 vehicles, 8 vaults, 39 illegal operations, 3 card sets, 100 WAiNK scans, 18 meditation spots, 42 shooting-range golds, 14 drone races, 52 areas, 500 Criminal Profile actions, $250k laundering, $100k spend, 8 garages, 10 Scooter Bros — then A Long Road.' },
  { n: 7, title: 'Finale', blurb: 'Untouched save, then the final mission (gold), and the platinum pops: Vice Got a Price!' },
];

// ---------- state ----------

function blankState() {
  return { earned: {}, progress: {}, spoiler: true, version: 1 };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return blankState();
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      progress: parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {},
      spoiler: parsed.spoiler !== false,
      version: 1,
    };
  } catch {
    return blankState();
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = loadState();
let trophies = [];
let byName = new Map();
let selectedName = null;

const $ = (id) => document.getElementById(id);

// ---------- helpers ----------

function isEarned(t) {
  return Object.prototype.hasOwnProperty.call(state.earned, t.name);
}

function progressOf(t) {
  const n = state.progress[t.name];
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function masked(t) {
  return state.spoiler && t.story && !isEarned(t);
}

function gradeLabel(g) {
  return g.charAt(0).toUpperCase() + g.slice(1);
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function linkFor(source) {
  const a = document.createElement('a');
  a.href = source.url;
  a.textContent = source.name;
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}

// ---------- header / totals ----------

function renderTotals() {
  const earned = trophies.filter(isEarned).length;
  $('earnedCount').textContent = earned;
  $('platinumPct').textContent = `${Math.round((earned / TOTAL) * 100)}% to platinum`;
  const bar = $('progressBar');
  bar.setAttribute('aria-valuenow', String(earned));
  $('progressFill').style.width = `${(earned / TOTAL) * 100}%`;
}

// ---------- checklist ----------

function currentFilters() {
  return {
    q: $('search').value.trim().toLowerCase(),
    kind: $('kindFilter').value,
    grade: $('gradeFilter').value,
    status: $('statusFilter').value,
  };
}

function trophyMatches(t, f) {
  if (f.grade && t.grade !== f.grade) return false;
  if (f.status === 'earned' && !isEarned(t)) return false;
  if (f.status === 'remaining' && isEarned(t)) return false;
  if (f.kind === 'missable') {
    if (!t.missable && !t.missable_note) return false;
  } else if (f.kind && !t.kind.includes(f.kind)) {
    return false;
  }
  if (f.q) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function renderChecklist() {
  const list = $('trophyList');
  list.innerHTML = '';
  const f = currentFilters();
  const shown = trophies.filter((t) => trophyMatches(t, f));
  const earnedShown = shown.filter(isEarned).length;
  $('countLine').textContent = `Showing ${shown.length} of ${TOTAL} trophies — ${earnedShown} earned in this view. ${trophies.filter(isEarned).length} earned overall.`;
  if (shown.length === 0) {
    const empty = el('li', 'empty', 'No trophies match these filters — clear the search or widen a filter.');
    list.appendChild(empty);
    return;
  }
  for (const t of shown) {
    const li = el('li', 'row' + (isEarned(t) ? ' earned' : '') + (selectedName === t.name ? ' selected' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = isEarned(t);
    box.setAttribute('aria-label', `Mark ${masked(t) ? 'hidden story trophy' : t.name} earned`);
    box.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleEarned(t);
    });
    li.appendChild(box);

    const mid = el('div');
    if (masked(t)) {
      mid.appendChild(el('div', 'name masked', 'Hidden story trophy — earn it to reveal'));
      mid.appendChild(el('div', 'desc', 'A story trophy. Its name and description stay hidden while spoiler mode is on.'));
    } else {
      mid.appendChild(el('div', 'name', t.name));
      mid.appendChild(el('div', 'desc', `\u201c${t.description}\u201d`));
    }
    const tags = el('div', 'tags');
    for (const k of t.kind) tags.appendChild(el('span', 'tag', k));
    if (t.hidden) tags.appendChild(el('span', 'tag hidden-tag', 'hidden'));
    if (t.missable) tags.appendChild(el('span', 'tag missable', 'missable'));
    else if (t.missable_note) tags.appendChild(el('span', 'tag missable', 'time-sensitive'));
    mid.appendChild(tags);

    if (t.psn_count !== null && t.psn_count !== undefined) {
      const counter = el('div', 'counter');
      counter.appendChild(el('span', '', 'PSN progress'));
      const minus = el('button', '', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', `Decrease progress for ${t.name}`);
      minus.addEventListener('click', (ev) => { ev.stopPropagation(); bumpProgress(t, -1); });
      const val = el('b', '', `${progressOf(t)} / ${t.psn_count}`);
      const plus = el('button', '', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', `Increase progress for ${t.name}`);
      plus.addEventListener('click', (ev) => { ev.stopPropagation(); bumpProgress(t, 1); });
      counter.append(minus, val, plus);
      mid.appendChild(counter);
    }
    li.appendChild(mid);

    const badge = el('span', `grade ${t.grade}`, gradeLabel(t.grade));
    li.appendChild(badge);
    li.addEventListener('click', () => openGuide(t));
    list.appendChild(li);
  }
}

function toggleEarned(t) {
  if (isEarned(t)) delete state.earned[t.name];
  else state.earned[t.name] = new Date().toISOString();
  saveState();
  renderAll();
}

function bumpProgress(t, delta) {
  const next = Math.max(0, Math.min(t.psn_count, progressOf(t) + delta));
  state.progress[t.name] = next;
  saveState();
  renderAll();
  if (selectedName === t.name) openGuide(t);
}

// ---------- guide pane ----------

function openGuide(t) {
  selectedName = t.name;
  const pane = $('guidePane');
  pane.innerHTML = '';
  if (masked(t)) {
    pane.appendChild(el('h2', '', 'Hidden story trophy'));
    pane.appendChild(el('p', 'official', 'Spoiler mode is on. This story trophy stays hidden until you earn it — its grade is shown in the list. Turn spoiler mode off in the filters above to reveal it.'));
    const row = el('div', 'earn-row');
    const btn = el('button', '', 'Mark earned');
    btn.addEventListener('click', () => toggleEarned(t));
    row.appendChild(btn);
    pane.appendChild(row);
    renderChecklist();
    return;
  }
  const head = el('div');
  head.appendChild(el('h2', '', t.name));
  head.appendChild(el('span', `grade ${t.grade}`, gradeLabel(t.grade)));
  pane.appendChild(head);
  pane.appendChild(el('p', 'official', `\u201c${t.description}\u201d`));
  const guide = el('p', '', t.guide);
  pane.appendChild(guide);
  if (t.missable) {
    const warn = el('div', 'warn', `Missable — ${t.missable_note} Keep a manual save at the start of every chapter and one untouched save before the final mission. There is no mission replay and no New Game Plus.`);
    pane.appendChild(warn);
  } else if (t.missable_note) {
    const warn = el('div', 'warn time', `Time-sensitive — ${t.missable_note}`);
    pane.appendChild(warn);
  }
  if (/unconfirmed/i.test(t.guide)) {
    pane.appendChild(el('div', 'unconfirmed', 'No confirmed unlock method has been published for this trophy at launch. The description above is the only hint — this guide does not invent a location or step.'));
  }
  if (t.psn_count !== null && t.psn_count !== undefined) {
    const counter = el('div', 'counter');
    counter.appendChild(el('span', '', 'Your PSN progress'));
    const minus = el('button', '', '−');
    minus.type = 'button';
    minus.addEventListener('click', () => bumpProgress(t, -1));
    counter.appendChild(minus);
    counter.appendChild(el('b', '', `${progressOf(t)} / ${t.psn_count}`));
    const plus = el('button', '', '+');
    plus.type = 'button';
    plus.addEventListener('click', () => bumpProgress(t, 1));
    counter.appendChild(plus);
    pane.appendChild(counter);
  }
  const row = el('div', 'earn-row');
  const btn = el('button', isEarned(t) ? 'earned' : '', isEarned(t) ? '✓ Earned — click to undo' : 'Mark earned');
  btn.addEventListener('click', () => toggleEarned(t));
  row.appendChild(btn);
  pane.appendChild(row);
  const src = el('div', 'sources');
  src.appendChild(el('strong', '', 'Sources: '));
  const ul = document.createElement('ul');
  for (const s of t.sources) {
    const li = document.createElement('li');
    li.appendChild(linkFor(s));
    ul.appendChild(li);
  }
  src.appendChild(ul);
  pane.appendChild(src);
  renderChecklist();
}

// ---------- roadmap ----------

function renderRoadmap() {
  const host = $('roadmapStages');
  host.innerHTML = '';
  for (const stage of STAGES) {
    const members = trophies.filter((t) => t.roadmap_stage === stage.n);
    const done = members.filter(isEarned).length;
    const box = el('div', 'stage');
    const h = el('h3', '', `Stage ${stage.n} — ${stage.title}`);
    h.appendChild(el('span', 'scount', `${done} / ${members.length} earned`));
    box.appendChild(h);
    box.appendChild(el('p', '', stage.blurb));
    const chips = el('div', 'chips');
    for (const t of members) {
      const chip = el('button', 'chip' + (isEarned(t) ? ' done' : ''), '');
      const dot = el('span', 'dot');
      dot.style.background = GRADE_DOT[t.grade];
      chip.appendChild(dot);
      chip.appendChild(document.createTextNode(masked(t) ? 'Hidden story trophy' : t.name));
      chip.addEventListener('click', () => {
        showView('checklist');
        openGuide(t);
      });
      chips.appendChild(chip);
    }
    box.appendChild(chips);
    host.appendChild(box);
  }
  const next = trophies
    .filter((t) => !isEarned(t))
    .sort((a, b) => a.roadmap_stage - b.roadmap_stage || a.id - b.id)[0];
  const up = $('nextUp');
  up.innerHTML = '';
  if (next) {
    up.appendChild(el('h3', '', 'Next up'));
    up.appendChild(el('p', '', `${masked(next) ? 'Hidden story trophy' : next.name} — Stage ${next.roadmap_stage}, ${STAGES[next.roadmap_stage].title}. ${gradeLabel(next.grade)} trophy.`));
    const btn = el('button', '', 'Open its guide');
    btn.addEventListener('click', () => {
      showView('checklist');
      openGuide(next);
    });
    up.appendChild(btn);
  } else {
    up.appendChild(el('h3', '', 'Platinum complete'));
    up.appendChild(el('p', '', 'All 55 trophies earned — Vice Got a Price! is yours.'));
  }
}

// ---------- missables ----------

function renderMissables() {
  const host = $('missableCards');
  host.innerHTML = '';
  const risk = trophies.find((t) => t.missable);
  const timed = trophies.find((t) => !t.missable && t.missable_note);
  for (const [t, cls, label] of [
    [risk, 'risk', 'Confirmed missable risk'],
    [timed, 'time', 'Time-sensitive'],
  ]) {
    if (!t) continue;
    const card = el('div', `mcard ${cls}`);
    const h = el('h3', '', '');
    h.appendChild(el('span', 'badge', label));
    card.appendChild(h);
    const title = el('p', '', '');
    title.appendChild(document.createElement('strong'));
    title.firstChild.textContent = t.name;
    title.appendChild(document.createTextNode(` — ${gradeLabel(t.grade)} trophy. `));
    title.appendChild(document.createTextNode(t.guide));
    card.appendChild(title);
    const open = el('button', 'chip', 'Open its guide');
    open.addEventListener('click', () => {
      showView('checklist');
      openGuide(t);
    });
    card.appendChild(open);
    host.appendChild(card);
  }
}

// ---------- progress view ----------

function renderProgress() {
  const host = $('progressCards');
  host.innerHTML = '';
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (isEarned(t)) counts[t.grade] += 1;
  const counted = trophies.filter((t) => t.psn_count !== null && t.psn_count !== undefined);
  const done = counted.filter((t) => progressOf(t) >= t.psn_count).length;
  const have = counted.reduce((s, t) => s + Math.min(progressOf(t), t.psn_count), 0);
  const target = counted.reduce((s, t) => s + t.psn_count, 0);
  const cards = [
    [`${trophies.filter(isEarned).length} / ${TOTAL}`, 'trophies earned'],
    [`${counts.platinum} / 1`, 'platinum'],
    [`${counts.gold} / 2`, 'gold'],
    [`${counts.silver} / 6`, 'silver'],
    [`${counts.bronze} / 46`, 'bronze'],
    [`${done} / ${counted.length}`, 'PSN counters finished'],
    [`${have.toLocaleString('en-US')} / ${target.toLocaleString('en-US')}`, 'PSN progress total'],
  ];
  for (const [n, l] of cards) {
    const card = el('div', 'pcard');
    card.appendChild(el('div', 'n', n));
    card.appendChild(el('div', 'l', l));
    host.appendChild(card);
  }
}

// ---------- export / import / reset ----------

function exportProgress() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const earned = parsed && parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {};
      const progress = parsed && parsed.progress && typeof parsed.progress === 'object' ? parsed.progress : {};
      let keptEarned = 0;
      let keptProgress = 0;
      for (const name of Object.keys(earned)) {
        if (byName.has(name)) {
          state.earned[name] = earned[name];
          keptEarned += 1;
        }
      }
      for (const name of Object.keys(progress)) {
        const t = byName.get(name);
        if (t && t.psn_count !== null && t.psn_count !== undefined) {
          state.progress[name] = Math.max(0, Math.min(t.psn_count, Math.floor(Number(progress[name]) || 0)));
          keptProgress += 1;
        }
      }
      saveState();
      renderAll();
      $('importMsg').textContent = `Imported ${keptEarned} earned trophies and ${keptProgress} progress counters. Names outside the 55 were ignored.`;
    } catch {
      $('importMsg').textContent = 'That file could not be read as progress — is it a gta6-trophy-progress.json export?';
    }
  };
  reader.readAsText(file);
}

// ---------- views ----------

function showView(name) {
  for (const btn of document.querySelectorAll('.tabs button')) {
    const active = btn.dataset.view === name;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
}

function renderAll() {
  renderTotals();
  renderChecklist();
  renderRoadmap();
  renderMissables();
  renderProgress();
  $('spoilerToggle').checked = state.spoiler;
  $('spoilerToggle2').checked = state.spoiler;
}

// ---------- boot ----------

async function boot() {
  const res = await fetch(DATA_URL);
  const data = await res.json();
  trophies = data.trophies;
  byName = new Map(trophies.map((t) => [t.name, t]));

  for (const btn of document.querySelectorAll('.tabs button')) {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  }
  $('search').addEventListener('input', renderChecklist);
  $('kindFilter').addEventListener('change', renderChecklist);
  $('gradeFilter').addEventListener('change', renderChecklist);
  $('statusFilter').addEventListener('change', renderChecklist);
  const spoilerChanged = (ev) => {
    state.spoiler = ev.target.checked;
    saveState();
    renderAll();
  };
  $('spoilerToggle').addEventListener('change', spoilerChanged);
  $('spoilerToggle2').addEventListener('change', spoilerChanged);
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) importProgress(file);
    ev.target.value = '';
  });
  $('resetBtn').addEventListener('click', () => {
    if (window.confirm('Reset all progress? This clears every earned trophy and counter in this browser.')) {
      state = blankState();
      selectedName = null;
      $('guidePane').innerHTML = '<p class="pane-empty">Select a trophy on the left to open its guide, sources and progress counter here.</p>';
      saveState();
      renderAll();
    }
  });

  const about = $('aboutSources');
  const seen = new Map();
  for (const t of trophies) {
    for (const s of t.sources) seen.set(s.name, s);
  }
  let first = true;
  for (const s of seen.values()) {
    if (!first) about.appendChild(document.createTextNode(', '));
    first = false;
    about.appendChild(linkFor(s));
  }

  renderAll();
}

boot();
