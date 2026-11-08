// главный файл сайта
import { api, AuthError, getToken, loadToken, saveToken } from './api.js?v=9';
import { isSoundOn, play, setSound } from './sound.js?v=9';
import { heroPortrait, heroSprite, weaponIcon } from './hero.js?v=9';
import { sprite } from './sprites.js?v=9';
import { renderTrail, resetTrail, trailHit, trailVisitCamp } from './trail.js?v=9';

const $ = (sel) => document.querySelector(sel);
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const KIND_HINT = { slime: 'мелочь', goblin: 'домашка', troll: 'большое задание', guard: 'проверка знаний', boss: 'контрольная' };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let S = null;            // состояние с сервера
let openTaskId = null;   // открытая карточка
let view = 'trail';      // trail | calendar
try { view = localStorage.getItem('danzh-view') || 'trail'; } catch { /* ничего страшного */ }


function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDate(iso) {
  const d = parseDate(iso);
  return `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
}

function addDays(iso, n) {
  const d = parseDate(iso);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toast(text, mood = '') {
  const el = document.createElement('div');
  el.className = `toast ${mood}`;
  el.textContent = text;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 2800);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));

async function run(fn) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError) {
      saveToken(null);
      showWelcome();
      toast('Не нашли героя — войди заново', 'bad');
    } else {
      toast(err.message || 'Что-то пошло не так. Проверь соединение и попробуй ещё раз.', 'bad');
    }
    return null;
  }
}

function setState(next) {
  S = next;
  if (next.removed_gear && next.removed_gear.length) {
    toast(`Уровень стал ниже, снято: ${next.removed_gear.join(', ')}`, 'bad');
  }
  render();
  if (openTaskId !== null && $('#monster').open) renderMonster();
  if ($('#profile').open) renderProfile();
  if ($('#skills').open) renderSkills();
  if ($('#gear').open) renderGear();
}


function showWelcome() {
  $('#app').hidden = true;
  $('#welcome').hidden = false;
  $('#welcome-art').innerHTML =
    sprite('torch', 'w-torch', {}, 3) + sprite('boss', 'w-boss', {}, 6) + sprite('torch', 'w-torch', {}, 3) +
    `<div class="w-floor">${heroSprite({ skin: 'blue' }, 'w-hero', 3)}${sprite('troll', 'w-troll', {}, 4)}${sprite('slime', 'w-slime', {}, 3)}</div>`;
  $('#pick-m').innerHTML = heroSprite({ gender: 'm' }, '', 2);
  $('#pick-f').innerHTML = heroSprite({ gender: 'f' }, '', 2);
  $('#hero-name').focus();
}

$('#welcome-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#hero-name').value.trim();
  if (!name) return;
  const gender = new FormData(e.target).get('gender') || 'm';
  const data = await run(() => api('/heroes', { method: 'POST', body: { name, gender } }));
  if (!data) return;
  saveToken(data.token);
  $('#welcome').hidden = true;
  $('#app').hidden = false;
  applyView();
  setState(data.state);
});


function render() {
  renderHero();
  renderGuide();
  renderRooms();
  if (view === 'trail') renderTrail($('#trail'), S);
  renderSideLists();
}

function applyView() {
  $('#trail').hidden = view !== 'trail';
  $('#rooms').hidden = view !== 'calendar';
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
}

document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
  view = b.dataset.view;
  try { localStorage.setItem('danzh-view', view); } catch { /* ничего страшного */ }
  applyView();
  play('click');
  if (view === 'trail' && S) { resetTrail(); renderTrail($('#trail'), S); }
}));

function renderSoundBtn() {
  const on = isSoundOn();
  $('#sound-btn').textContent = on ? 'Звук вкл' : 'Звук выкл';
  $('#sound-btn').setAttribute('aria-pressed', String(on));
}

$('#sound-btn').addEventListener('click', () => { setSound(!isSoundOn()); renderSoundBtn(); });

function renderHero() {
  const h = S.hero;
  $('#hero-avatar').innerHTML = heroPortrait(h, 2) + (h.pet ? sprite(h.pet, 'pet', {}, 1) : '');
  $('#hero-name-label').textContent = h.name;
  $('#hero-level').textContent = h.level;
  $('#xp-fill').style.width = `${(100 * h.xp_in_level) / h.xp_per_level}%`;

  // зелёный - сделано, с рамкой - надо сделать, пустой - свободно
  const capacity = S.stamina.capacity;
  const todayItems = S.days[0].items.filter((i) => !i.is_battle);
  const done = todayItems.filter((i) => i.done).length;
  const planned = todayItems.length - done;
  let pips = '';
  for (let i = 0; i < Math.max(capacity, todayItems.length); i++) {
    const cls = i < done ? 'done' : i < done + planned ? 'planned' : '';
    pips += `<span class="pip ${cls}"></span>`;
  }
  $('#stamina').innerHTML = `<span class="stamina-label">Удары сегодня <b>${done}/${todayItems.length || 0}</b></span><span class="pips">${pips}</span>`;
  $('#stamina').title = `Сегодня нанесено ${done}, осталось ${planned}. Выносливость — ${capacity} удара в день.`;
}

function renderGuide() {
  const [first, ...rest] = S.guide;
  if (!first) { $('#guide').innerHTML = ''; return; }
  const action = (m) => {
    if (m.step_id) {
      const item = S.days[0].items.find((i) => i.step_id === m.step_id);
      return `<button class="btn btn-ink" data-hit="${m.step_id}">Ударить: ${esc(item ? item.step : '')}</button>`;
    }
    if (m.task_id && m.mood === 'fog') return `<button class="btn btn-ink" data-open="${m.task_id}">Назначить новый срок</button>`;
    if (m.task_id) return `<button class="link-btn ink" data-open="${m.task_id}">Открыть карточку</button>`;
    return '';
  };
  $('#guide').innerHTML = `
    <header class="scroll-head">${sprite('fox', 'scroll-fox')}<h2>Картограф</h2></header>
    <p class="scroll-main mood-${first.mood}">${esc(first.text)}</p>
    <div class="scroll-actions">${action(first)}</div>
    ${rest.length ? `<ul class="scroll-more">${rest.map((m) => `<li class="mood-${m.mood}">${esc(m.text)} ${m.task_id && !m.step_id ? action(m) : ''}</li>`).join('')}</ul>` : ''}`;
}

function taskById(id) {
  return S.tasks.find((t) => t.id === id);
}

function renderRooms() {
  $('#rooms').innerHTML = S.days.map((day) => {
    // шаги по заданиям
    const groups = new Map();
    for (const it of day.items) {
      if (!groups.has(it.task_id)) groups.set(it.task_id, []);
      groups.get(it.task_id).push(it);
    }
    const groupHtml = [...groups.entries()].map(([taskId, items]) => {
      const t = taskById(taskId);
      const training = items.every((it) => it.is_training);
      const steps = items.map((it) => `
        <li><button class="step ${it.done ? 'done' : ''} ${it.is_battle ? 'battle' : ''}" data-${it.done ? 'undo' : 'hit'}="${it.step_id}"
            aria-label="${it.done ? 'Отменить удар' : 'Ударить'}: ${esc(it.step)}">
          <span class="tick" aria-hidden="true"></span>${esc(it.step)}</button></li>`).join('');
      return `
        <div class="monster-row kind-${t.kind} ${t.status === 'done' ? 'defeated' : ''}">
          <button class="monster-name" data-open="${t.id}">${sprite(training ? 'dummy' : t.kind, 'mini')}<span>${training ? 'Подготовка: ' : ''}${esc(t.title)}${t.subject ? `<small>${esc(t.subject)}</small>` : ''}</span></button>
          <ul class="steps">${steps}</ul>
        </div>`;
    }).join('');

    const doors = day.deadlines
      .filter((d) => d.kind !== 'boss' && d.kind !== 'guard')
      .map((d) => `<button class="door" data-open="${d.task_id}">${sprite('door', 'mini')}<span>Срок сдачи: ${esc(d.title)}</span></button>`)
      .join('');

    let empty = '';
    if (!groups.size && !doors) {
      empty = day.rest
        ? `<p class="room-empty">${sprite('tent', 'mini')} Привал. Отдыхаем.</p>`
        : `<p class="room-empty">Тихо. Монстров нет.</p>`;
    }

    const used = Math.min(day.used, day.capacity);
    return `
      <li class="room ${day.is_today ? 'today' : ''} ${day.rest ? 'rest' : ''} ${day.overload ? 'overload' : ''}">
        <header class="room-head">
          <div class="room-day"><span class="wd">${day.weekday}</span><span class="dt">${day.is_today ? 'сегодня' : day.label}</span></div>
          <span class="room-load" title="Ударов в этот день">${day.used}/${day.capacity}</span>
          <button class="rest-btn ${day.rest ? 'on' : ''}" data-rest="${day.date}" aria-pressed="${day.rest}"
                  title="${day.rest ? 'Убрать привал' : 'Сделать этот день привалом'}">${sprite('tent', 'micro')}<span>Привал</span></button>
        </header>
        <div class="room-load-bar" aria-hidden="true"><span style="width:${(100 * used) / day.capacity}%"></span></div>
        ${groupHtml}${doors}${empty}
      </li>`;
  }).join('');
}

function renderSideLists() {
  const lastDay = S.days[S.days.length - 1].date;
  const fog = S.tasks.filter((t) => t.status === 'fog');
  const ahead = S.tasks.filter((t) => t.status === 'active' && t.deadline > lastDay);
  const done = S.tasks.filter((t) => t.status === 'done');

  $('#fog').hidden = !fog.length;
  $('#fog-list').innerHTML = fog.map((t) => `
    <li><button class="list-item" data-open="${t.id}">${sprite(t.kind, 'mini fogged')}
      <span>${esc(t.title)}<small>срок был ${fmtDate(t.deadline)}</small></span></button></li>`).join('');

  $('#ahead').hidden = !ahead.length;
  $('#ahead-list').innerHTML = ahead.map((t) => `
    <li><button class="list-item" data-open="${t.id}">${sprite(t.kind, 'mini')}
      <span>${esc(t.title)}<small>${fmtDate(t.deadline)}</small></span></button></li>`).join('');

  const w = S.week;
  $('#week').hidden = !w.steps && !done.length;
  $('#week-stats').innerHTML = `
    <div><dt>Ударов</dt><dd>${w.steps}</dd></div>
    <div><dt>Опыта</dt><dd>+${w.xp}</dd></div>
    <div><dt>Побеждено</dt><dd>${w.defeated_total}</dd></div>`;
  const notes = [];
  if (w.best_day) notes.push(`Самый сильный день: ${fmtDate(w.best_day.date)}, ${w.best_day.steps} уд.`);
  for (const b of w.bosses) notes.push(b.done ? `Босс «${esc(b.title)}» повержен.` : `Босс «${esc(b.title)}» ослаблен на ${b.weakened}%.`);
  $('#week-note').innerHTML = notes.join('<br>');
  $('#trophy-list').innerHTML = done.map((t) => `
    <button class="trophy" data-open="${t.id}" title="${esc(t.title)}">${sprite(t.kind, 'mini')}<span>${esc(t.title)}</span></button>`).join('');
}


function openMonster(id) {
  openTaskId = id;
  renderMonster();
  if (!$('#monster').open) $('#monster').showModal();
}

function renderMonster() {
  const t = taskById(openTaskId);
  if (!t) { $('#monster').close(); return; }
  const hp = Array.from({ length: t.hp_total }, (_, i) => `<span class="${i < t.hp_left ? 'full' : ''}"></span>`).join('');
  const steps = t.steps.map((s) => `
    <li class="${s.done ? 'done' : ''} ${s.is_battle ? 'battle' : ''}">
      <span class="step-text">${esc(s.name)}
        <small>${s.done ? 'сделано' : s.planned_date ? `в плане на ${fmtDate(s.planned_date)}` : 'ждёт нового срока'}</small></span>
      ${s.done
        ? `<button class="btn btn-ghost" data-undo="${s.id}">Отменить</button>`
        : `<button class="btn btn-torch" data-hit="${s.id}" ${t.status === 'fog' ? 'disabled' : ''}>Ударить</button>`}
    </li>`).join('');

  let status = '';
  if (t.status === 'done') status = `<p class="badge win">Побеждён</p>`;
  else if (t.status === 'fog') status = `<p class="badge fog">В тумане — назначь новый срок</p>`;
  else if (t.kind === 'boss' || t.kind === 'guard') status = `<p class="badge boss">Ослаблен на ${t.weakened}%</p>`;

  $('#monster-body').innerHTML = `
    <button class="close" data-close="monster" aria-label="Закрыть">×</button>
    <div class="m-top">
      <div class="m-sprite ${t.status === 'fog' ? 'fogged' : ''} ${t.status === 'done' ? 'defeated' : ''}" id="m-sprite">${sprite(t.kind, 'big')}</div>
      <div class="m-info">
        <p class="m-kind">${esc(t.kind_name)}, ${KIND_HINT[t.kind]}</p>
        <h2 class="m-title">${esc(t.title)}</h2>
        ${t.subject ? `<p class="m-subject">${esc(t.subject)}</p>` : ''}
        <div class="hp kind-${t.kind}" role="img" aria-label="Здоровье ${t.hp_left} из ${t.hp_total}">${hp}</div>
        ${status}
      </div>
    </div>
    <ol class="m-steps">${steps}</ol>
    <form class="m-deadline m-kind-form" id="kind-form">
      <div class="row">
        <label>Тип<select name="kind" ${t.steps.some((x) => x.done) ? 'disabled title="По монстру уже были удары"' : ''}>${Object.entries(S.kinds)
          .map(([id, k]) => `<option value="${id}" ${id === t.kind ? 'selected' : ''}>${k.name}: ${k.about}</option>`).join('')}</select></label>
        <label>Предмет<select name="subject"><option value="">не указан</option>${S.subjects
          .map((x) => `<option ${x === t.subject ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      </div>
    </form>
    <form class="m-deadline" id="deadline-form">
      <label for="deadline-input">Срок: ${fmtDate(t.deadline)}</label>
      <div class="row">
        <input type="date" id="deadline-input" value="${t.deadline}" min="${S.today}" required>
        <button class="btn btn-ghost" type="submit">Перенести срок</button>
      </div>
    </form>
    <button class="link-btn danger" data-delete="${t.id}">Прогнать монстра (удалить задание)</button>`;

  $('#kind-form').addEventListener('change', async (e) => {
    const body = { [e.target.name]: e.target.value };
    const next = await run(() => api(`/tasks/${t.id}`, { method: 'PATCH', body }));
    if (next) { setState(next); toast(e.target.name === 'kind' ? 'Тип изменён, шаги пересобраны' : 'Предмет изменён'); }
    else renderMonster();
  });
  $('#deadline-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const deadline = $('#deadline-input').value;
    const next = await run(() => api(`/tasks/${t.id}`, { method: 'PATCH', body: { deadline } }));
    if (next) { setState(next); toast(`Новый срок: ${fmtDate(deadline)}`); }
  });
}


async function hit(stepId) {
  const data = await run(() => api(`/steps/${stepId}/hit`, { method: 'POST' }));
  if (!data) return;
  const r = data.result;
  play('hit');
  const spriteEl = $('#monster').open ? $('#m-sprite') : null;
  if (spriteEl && !reduceMotion) {
    spriteEl.classList.add(r.victory ? 'shatter' : 'hit');
    await sleep(r.victory ? 750 : 280);
  } else if (view === 'trail') {
    await trailHit($('#trail'), r.task_id, r.victory);
  }
  if (r.victory) play('victory');
  if (r.level_up) setTimeout(() => play('levelup'), 500);
  setState(data.state);
  if (r.xp) toast(`+${r.xp} опыта`, 'xp');
  if (r.victory) {
    const t = taskById(r.task_id);
    toast(`Победа! ${t ? `«${t.title}» повержен` : 'Монстр повержен'}`, 'win');
  }
  if (r.level_up) toast(`Новый уровень: ${r.level}! Загляни в снаряжение`, 'win');
  if (r.skill_up) toast(`${r.skill_up.name}: уровень ${r.skill_up.level}`, 'win');
  for (const w of r.weapon_up || []) {
    toast(w.tier === 1 ? `Открыто оружие: ${w.name}` : `Оружие улучшено: ${w.name}`, 'win');
  }
}

async function undo(stepId) {
  const next = await run(() => api(`/steps/${stepId}/undo`, { method: 'POST' }));
  if (next) { play('undo'); setState(next); toast('Удар отменён'); }
}

async function toggleRest(day) {
  const wasRest = S.days.find((d) => d.date === day)?.rest;
  const next = await run(() => api(`/rest/${day}`, { method: 'POST' }));
  if (!next) return;
  play('rest');
  setState(next);
  // если привал не сегодня, герой сходит к костру и вернётся
  if (!wasRest && day !== S.today && view === 'trail') trailVisitCamp($('#trail'), day, S.hero);
}

async function removeTask(id) {
  const t = taskById(id);
  if (!confirm(`Удалить «${t.title}» вместе со всеми ударами?`)) return;
  const next = await run(() => api(`/tasks/${id}`, { method: 'DELETE' }));
  if (next) { $('#monster').close(); setState(next); toast('Монстр прогнан'); }
}

// все клики
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-hit],[data-undo],[data-open],[data-rest],[data-delete],[data-close]');
  if (!el) return;
  const d = el.dataset;
  if (d.hit) hit(Number(d.hit));
  else if (d.undo) undo(Number(d.undo));
  else if (d.open) openMonster(Number(d.open));
  else if (d.rest) toggleRest(d.rest);
  else if (d.delete) removeTask(Number(d.delete));
  else if (d.close) $('#' + d.close).close();
});

// клик мимо окна закрывает его
for (const dlg of document.querySelectorAll('dialog')) {
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
}


$('#quick-add').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('#phrase').value.trim();
  if (!text) return;
  const data = await run(() => api('/parse', { method: 'POST', body: { text } }));
  if (!data) return;
  if (!data.drafts.length) {
    toast('Не нашёл заданий. Напиши, что задали и когда: «завтра выучить слова по английскому»', 'bad');
    return;
  }
  showDrafts(data.drafts);
});

$('#manual-add').addEventListener('click', () => {
  showDrafts([{ title: '', kind: 'goblin', subject: '', deadline: addDays(S.today, 1), date_guessed: false }]);
});

const PHONE = matchMedia('(max-width: 760px)');

function showDrafts(drafts) {
  const kindOptions = (sel) => Object.entries(S.kinds)
    .map(([id, k]) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${k.name} — ${k.about}</option>`).join('');
  // на телефоне показываем отдельным окном
  const mobile = PHONE.matches;
  const host = mobile ? $('#drafts-sheet-body') : $('#drafts');
  hideDrafts();
  if (!mobile) $('#drafts').hidden = false;
  host.innerHTML = `
    <form id="drafts-form">
      <div class="drafts-head">
        <h2>Проверь, что записать</h2>
        ${mobile ? '<button type="button" class="close" id="drafts-x" aria-label="Закрыть">×</button>' : ''}
      </div>
      <div class="drafts-list">
      ${drafts.map((d, i) => `
        <fieldset class="draft" data-i="${i}">
          <legend class="sr-only">Задание ${i + 1}</legend>
          <div class="draft-sprite">${sprite(d.kind, 'mid')}</div>
          <div class="draft-fields">
            <label>Название<input name="title" value="${esc(d.title)}" maxlength="120" required></label>
            <div class="row">
              <label>Монстр<select name="kind">${kindOptions(d.kind)}</select></label>
              <label>Срок<input type="date" name="deadline" value="${d.deadline}" required></label>
            </div>
            <label>Предмет<input name="subject" value="${esc(d.subject)}" maxlength="40" placeholder="необязательно"></label>
            ${d.date_guessed ? '<p class="hint warn">Срок в фразе не назван — я поставил примерный. Проверь дату.</p>' : ''}
          </div>
          <button type="button" class="close" data-drop="${i}" aria-label="Убрать это задание">×</button>
        </fieldset>`).join('')}
      </div>
      <div class="row end drafts-actions">
        <button type="button" class="btn btn-ghost" id="drafts-cancel">Отмена</button>
        <button type="submit" class="btn btn-torch">Записать в подземелье</button>
      </div>
    </form>`;

  const form = $('#drafts-form');
  form.addEventListener('change', (e) => {
    if (e.target.name === 'kind') {
      e.target.closest('.draft').querySelector('.draft-sprite').innerHTML = sprite(e.target.value, 'mid');
    }
  });
  form.addEventListener('click', (e) => {
    const drop = e.target.closest('[data-drop]');
    if (drop) {
      drop.closest('.draft').remove();
      if (!form.querySelector('.draft')) hideDrafts();
    }
  });
  $('#drafts-cancel').addEventListener('click', hideDrafts);
  if (mobile) {
    $('#drafts-x').addEventListener('click', hideDrafts);
    $('#drafts-sheet').showModal();
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tasks = [...form.querySelectorAll('.draft')].map((fs) => ({
      title: fs.querySelector('[name=title]').value.trim(),
      kind: fs.querySelector('[name=kind]').value,
      subject: fs.querySelector('[name=subject]').value.trim(),
      deadline: fs.querySelector('[name=deadline]').value,
    }));
    const next = await run(() => api('/tasks', { method: 'POST', body: { tasks } }));
    if (!next) return;
    hideDrafts();
    $('#phrase').value = '';
    play('add');
    setState(next);
    toast(tasks.length > 1 ? 'Монстры появились на тропе' : 'Монстр появился на тропе');
  });
  // на телефоне не открываем клавиатуру сразу
  if (!mobile) form.querySelector('input').focus();
}

function hideDrafts() {
  $('#drafts').hidden = true;
  $('#drafts').innerHTML = '';
  if ($('#drafts-sheet').open) $('#drafts-sheet').close();
  $('#drafts-sheet-body').innerHTML = '';
}

$('#drafts-sheet').addEventListener('close', () => { $('#drafts-sheet-body').innerHTML = ''; });


$('#skills-icon').innerHTML = weaponIcon('book', 1, 2);
$('#gear-icon').innerHTML = sprite('chest', '', {}, 2);

$('#open-profile').addEventListener('click', () => { renderProfile(); $('#profile').showModal(); });
$('#open-skills').addEventListener('click', () => { renderSkills(); $('#skills').showModal(); });
$('#open-gear').addEventListener('click', () => { renderGear(); $('#gear').showModal(); });

async function patchHero(body) {
  const next = await run(() => api('/hero', { method: 'PATCH', body }));
  if (next) setState(next);
  return next;
}

function renderProfile() {
  const h = S.hero;
  const loginLink = `${location.origin}/?hero=${getToken()}`;
  $('#profile-body').innerHTML = `
    <button class="close" data-close="profile" aria-label="Закрыть">×</button>
    <div class="gear-head">${heroSprite(h, 'gear')}
      <div>
        <h2>${esc(h.name)}</h2>
        <p class="hint">${h.level} уровень, опыта: ${h.xp}</p>
      </div>
    </div>
    <h3>Имя</h3>
    <form id="rename" class="row">
      <input name="name" value="${esc(h.name)}" maxlength="40" aria-label="Имя" required>
      <button class="btn btn-ghost" type="submit">Сохранить</button>
    </form>
    <h3>Персонаж</h3>
    <div class="gender-switch" role="group" aria-label="Персонаж">
      <button type="button" data-gender="m" aria-pressed="${h.gender === 'm'}">Герой</button>
      <button type="button" data-gender="f" aria-pressed="${h.gender === 'f'}">Героиня</button>
    </div>
    <h3>Бот в MAX</h3>
    ${h.linked
      ? '<p>Бот подключён: напоминания приходят в MAX.</p>'
      : `<p>Найди бота «Данж недели» в MAX и отправь ему код <b class="code">${h.link_code}</b>. Он начнёт присылать напоминания и принимать задания сообщением.</p>`}
    <h3>Вход с другого устройства</h3>
    <p class="hint">Открой эту ссылку на телефоне. Никому её не показывай, это ключ от твоего героя.</p>
    <div class="row">
      <input id="login-link" readonly value="${esc(loginLink)}" aria-label="Ссылка для входа">
      <button class="btn btn-ghost" type="button" id="copy-link">Скопировать</button>
    </div>
    <button class="link-btn danger" type="button" id="logout">Выйти на этом устройстве</button>`;

  $('#rename').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await patchHero({ name: e.target.name.value.trim() })) toast('Имя сохранено');
  });
  $('#profile-body').querySelectorAll('[data-gender]').forEach((btn) =>
    btn.addEventListener('click', () => patchHero({ gender: btn.dataset.gender })));
  $('#copy-link').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(loginLink); toast('Ссылка скопирована'); } catch { $('#login-link').select(); }
  });
  $('#logout').addEventListener('click', () => {
    if (!confirm('Выйти? Вернуться можно только по ссылке для входа — сохрани её заранее.')) return;
    saveToken(null);
    $('#profile').close();
    showWelcome();
  });
}

function renderSkills() {
  const h = S.hero;
  const reward = Object.fromEntries(h.weapons.filter((w) => w.skill).map((w) => [w.skill, w]));
  const list = h.skills.map((sk) => {
    const w = reward[sk.id];
    return `
    <li class="skill ${sk.xp ? '' : 'zero'}">
      <span class="skill-name">${esc(sk.name)}</span>
      <span class="skill-lvl">${sk.level}</span>
      <span class="skill-rank">${sk.rank}</span>
      <span class="skill-bar"><i style="width:${Math.round(sk.progress * 100)}%"></i></span>
      <small>${sk.to_next === null ? 'максимум' : `до уровня ${sk.level + 1}: ${sk.to_next} оп.`}</small>
      ${w ? `<span class="skill-reward ${w.unlocked ? 'got' : ''}">${weaponIcon(w.id, Math.max(w.tier, 1), 2)}
        <span>${esc(w.name)}${tierStars(w)}<br>${w.next ? `${w.unlocked ? 'улучшение' : 'откроется'} на ${w.next.level} ур.` : 'максимум'}</span></span>` : ''}
    </li>`;
  }).join('');
  $('#skills-body').innerHTML = `
    <button class="close" data-close="skills" aria-label="Закрыть">×</button>
    <h2>Навыки</h2>
    <p class="hint">Навык растёт, когда бьёшь монстров своего предмета. На 3 уровне открывается оружие,
      на 6 и 10 оно улучшается.</p>
    <ul class="skills">${list}</ul>`;
}

function tierStars(w) {
  if (!w.unlocked) return '';
  return ` <span class="stars" title="Ступень ${w.tier} из 3">${'★'.repeat(w.tier)}${'☆'.repeat(3 - w.tier)}</span>`;
}

const GEAR_TABS = [
  { id: 'skin', name: 'Броня' },
  { id: 'pet', name: 'Питомец' },
  { id: 'weapon', name: 'Оружие' },
];
let gearTab = 'skin';

function renderGear() {
  const h = S.hero;
  const lists = {
    skin: h.skins.map((s) => ({ ...s, pic: heroSprite({ ...h, skin: s.id }, 'gear'), lock: `с ${s.level} уровня` })),
    pet: h.pets.map((p) => ({ ...p, pic: p.id ? sprite(p.id, 'gear') : '<span class="sprite empty-pet"></span>', lock: `с ${p.level} уровня` })),
    weapon: h.weapons.map((w) => ({
      ...w, lock: w.need, stars: tierStars(w),
      pic: `<span class="tiers">${[1, 2, 3].map((t) => `<span class="${t <= w.tier ? 'got' : ''} ${t === w.tier ? 'now' : ''}">${weaponIcon(w.id, t, 2)}</span>`).join('')}</span>`,
      note: w.unlocked && w.next ? `дальше: ${w.next.name}, ${w.source.toLowerCase()} ${w.next.level}` : '',
    })),
  };
  const current = { skin: h.skin, pet: h.pet, weapon: h.weapon };
  const chosen = (tab) => lists[tab].find((it) => it.id === current[tab])?.name || 'нет';
  const opened = (tab) => lists[tab].filter((it) => it.unlocked).length;
  const tabs = GEAR_TABS.map((t) => `
    <button type="button" role="tab" data-tab="${t.id}" aria-selected="${t.id === gearTab}">
      ${t.name}<small>${esc(chosen(t.id))}</small>
    </button>`).join('');
  const items = lists[gearTab].map((it) => `
    <button class="gear-item ${it.id === current[gearTab] ? 'on' : ''}" data-pick="${it.id}" ${it.unlocked ? '' : 'disabled'}
            aria-pressed="${it.id === current[gearTab]}">
      ${it.pic}<span>${esc(it.name)}${it.stars || ''}${it.unlocked ? '' : `<small>${esc(it.lock)}</small>`}${it.note ? `<small>${esc(it.note)}</small>` : ''}</span>
    </button>`).join('');
  $('#gear-body').innerHTML = `
    <button class="close" data-close="gear" aria-label="Закрыть">×</button>
    <div class="gear-head">
      <span class="gear-preview">${h.pet ? sprite(h.pet, 'gear') : ''}${heroSprite(h, '', 3)}</span>
      <div>
        <h2>Снаряжение</h2>
        <p class="hint">Броня и питомцы открываются с уровнем героя. Оружие открывается навыком предмета
          на 3 уровне и улучшается на 6 и 10.</p>
      </div>
    </div>
    <div class="gear-tabs" role="tablist" aria-label="Категория">${tabs}</div>
    <p class="hint gear-count">Открыто ${opened(gearTab)} из ${lists[gearTab].length}</p>
    <div class="gear-grid" role="tabpanel">${items}</div>`;

  $('#gear-body').querySelectorAll('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
    gearTab = btn.dataset.tab;
    renderGear();
  }));
  $('#gear-body').querySelectorAll('[data-pick]').forEach((btn) => btn.addEventListener('click', () => {
    patchHero({ [gearTab]: btn.dataset.pick });
  }));
}


async function start() {
  if (!loadToken()) { showWelcome(); return; }
  const state = await run(() => api('/state'));
  if (!state) return;
  $('#welcome').hidden = true;
  $('#app').hidden = false;
  applyView();
  setState(state);
}

renderSoundBtn();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => { /* и без этого работает */ });
}

// если вкладку не закрывали до следующего дня
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && S) run(() => api('/state')).then((s) => s && setState(s));
});

start();
