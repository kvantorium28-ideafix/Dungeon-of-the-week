// карта-поход. слои: небо, горы, холмы, тропа, передний план
// дальние слои двигаются медленнее, так получается объём
import { heroSitSprite, heroSprite } from './hero.js?v=9';
import { THEMES, registerScenery, ridge, ridgePolygon, rng, seasonFor, snowCaps } from './scenery.js?v=9';
import { play } from './sound.js?v=9';
import { sprite } from './sprites.js?v=9';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const WALK_MS = 900;

const H = 420;          // высота сцены
const CLIFF = 372;      // где земля обрывается
const PATH_Y = 262;     // середина тропы
const WAVE = 30;
const PARALLAX = { far: 0.12, hills: 0.35, fg: 1.3 };
const W = { fog: 170, day: 110, monster: 150, dummy: 120, track: 110, camp: 150, quiet: 100, horizon: 150 };

let heroPos = null;
let walkToken = 0;    // чтобы старая анимация не мешала новой
const CAMP_SEAT = 72; // герой садится левее костра

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const groundY = (x) => PATH_Y + Math.round(WAVE * Math.sin(x / 230));

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// что стоит на тропе. тренировки - манекены, босс только в день битвы
// большое задание: монстр в первый день, дальше следы
function buildNodes(S) {
  const nodes = [];
  const fog = S.tasks.filter((t) => t.status === 'fog');
  if (fog.length) nodes.push({ type: 'fog', tasks: fog });
  const seen = new Set();

  S.days.forEach((day, di) => {
    nodes.push({ type: 'day', day, di });
    const groups = new Map();
    for (const it of day.items) {
      if (!groups.has(it.task_id)) groups.set(it.task_id, []);
      groups.get(it.task_id).push(it);
    }
    const list = [];
    for (const [id, items] of groups) {
      const task = S.tasks.find((t) => t.id === id);
      const trainings = items.filter((i) => i.is_training);
      const battle = items.filter((i) => i.is_battle);
      const rest = items.filter((i) => !i.is_training && !i.is_battle);
      const cleared = (arr) => arr.every((i) => i.done);
      if (trainings.length) list.push({ type: 'dummy', task, items: trainings, di, cleared: cleared(trainings) });
      if (battle.length) list.push({ type: 'monster', task, items: battle, di, cleared: cleared(battle), battle: true });
      if (rest.length) {
        const type = seen.has(id) ? 'track' : 'monster';
        list.push({ type, task, items: rest, di, cleared: cleared(rest) });
        seen.add(id);
      }
    }
    list.sort((a, b) => Number(b.cleared) - Number(a.cleared));
    nodes.push(...list);
    if (day.rest) nodes.push({ type: 'camp', day, di });
    else if (!list.length) nodes.push({ type: 'quiet', day, di });
  });

  const lastDay = S.days[S.days.length - 1].date;
  nodes.push({ type: 'horizon', ahead: S.tasks.filter((t) => t.status === 'active' && t.deadline > lastDay) });

  let x = 90;
  for (const n of nodes) {
    n.x = x + W[n.type] / 2;
    n.y = groundY(n.x);
    x += W[n.type];
  }
  return { nodes, width: x + 60 };
}

function findHero(nodes) {
  const camp = nodes.find((n) => n.type === 'camp' && n.di === 0);
  if (camp) return { x: camp.x - CAMP_SEAT, target: null, sit: true };
  const target = nodes.find((n) => n.di === 0 && (n.type === 'monster' || n.type === 'dummy') && !n.cleared);
  if (target) return { x: target.x - 74, target };
  const tomorrow = nodes.find((n) => n.type === 'day' && n.di === 1);
  return { x: tomorrow ? tomorrow.x - 50 : 140, target: null };
}

function findCaves(nodes, width) {
  const days = nodes.filter((n) => n.type === 'day');
  const caves = [];
  days.forEach((n, i) => {
    const boss = n.day.deadlines.some((d) => d.kind === 'boss')
      || nodes.some((m) => m.di === n.di && m.battle && m.task.kind === 'boss');
    if (!boss) return;
    const x0 = n.x - W.day / 2;
    const x1 = i + 1 < days.length ? days[i + 1].x - W.day / 2 : width - 60;
    caves.push({ x0, x1 });
  });
  return caves;
}


function pathPoints(x0, x1, dy = 0) {
  const pts = [];
  for (let x = x0; x <= x1; x += 16) pts.push(`${x},${groundY(x) + dy}`);
  pts.push(`${x1},${groundY(x1) + dy}`);
  return pts.join(' ');
}

function skyHtml(t, vw, seed) {
  const rand = rng(`sky${seed}`);
  let html = '';
  if (t.stars) {
    for (let i = 0; i < 46; i++) {
      html += `<i class="star" style="left:${Math.round(rand() * vw)}px;top:${Math.round(rand() * 120)}px;animation-delay:-${(rand() * 4).toFixed(1)}s"></i>`;
    }
  }
  const body = t.sun || t.moon;
  if (body) html += `<i class="${t.sun ? 'sun' : 'moon'}" style="left:${Math.round(vw * body.x)}px;top:${body.y}px;--c:${body.color}"></i>`;
  if (t.clouds) {
    for (let i = 0; i < 4; i++) {
      html += `<i class="cloud" style="top:${20 + Math.round(rand() * 70)}px;--c:${t.clouds};animation-duration:${90 + Math.round(rand() * 80)}s;animation-delay:-${Math.round(rand() * 120)}s"></i>`;
    }
  }
  return html;
}

function farSvg(t, w, seed) {
  const pts = ridge(w, 160, 90, 12, `far${seed}`);
  return `<svg width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" shape-rendering="crispEdges">
    <path d="${ridgePolygon(pts, H)}" fill="${t.far}"/>
    <path d="${snowCaps(pts, 104)}" fill="${t.farSnow}"/></svg>`;
}

function hillsSvg(t, w, seed) {
  const back = ridge(w, 196, 46, 8, `hb${seed}`, 1.4);
  const front = ridge(w, 214, 30, 8, `hf${seed}`, 2.2);
  const rand = rng(`ht${seed}`);
  let trees = '';
  for (let x = 10; x < w; x += 26 + rand() * 40) {
    const i = Math.min(back.length - 1, Math.round(x / 8));
    const [name, pal] = t.trees[Math.floor(rand() * t.trees.length)];
    trees += `<span class="decor" style="left:${Math.round(x)}px;top:${back[i][1] + 10}px">${sprite(name, '', pal, 2)}</span>`;
  }
  return `<svg width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" shape-rendering="crispEdges">
    <path d="${ridgePolygon(back, H)}" fill="${t.hills}"/></svg>${trees}
    <svg class="hills-front" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" shape-rendering="crispEdges">
    <path d="${ridgePolygon(front, H)}" fill="${t.hillsDark}"/></svg>`;
}

function groundSvg(t, width, seed) {
  const rand = rng(`g${seed}`);
  let tufts = '';
  for (let i = 0; i < width / 9; i++) {
    const x = Math.round(rand() * width);
    const y = 200 + Math.round(rand() * (CLIFF - 210));
    tufts += `<rect x="${x}" y="${y}" width="${2 + Math.round(rand() * 3)}" height="2"/>`;
  }
  let specks = '';
  for (let x = 6; x < width; x += 14 + rand() * 18) {
    specks += `<rect x="${Math.round(x)}" y="${groundY(x) - 8 + Math.round(rand() * 16)}" width="3" height="2"/>`;
  }
  // обрыв внизу
  let lip = `M0 ${CLIFF}`;
  let stones = '';
  for (let x = 0; x <= width; x += 12) {
    lip += ` L${x} ${CLIFF + (rand() < 0.4 ? 4 : 0)} L${x + 12} ${CLIFF + (rand() < 0.4 ? 4 : 0)}`;
    if (rand() < 0.3) stones += `<rect x="${x}" y="${CLIFF + 14 + Math.round(rand() * 26)}" width="${6 + Math.round(rand() * 8)}" height="4"/>`;
  }
  lip += ` L${width} ${CLIFF - 2} L0 ${CLIFF - 2} Z`;
  return `<svg class="tw-ground" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}" shape-rendering="crispEdges" aria-hidden="true">
    <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.ground[0]}"/><stop offset="1" stop-color="${t.ground[1]}"/></linearGradient></defs>
    <rect x="0" y="196" width="${width}" height="${CLIFF - 196}" fill="url(#gr)"/>
    <g fill="${t.tuft}">${tufts}</g>
    <polyline points="${pathPoints(0, width, 6)}" fill="none" stroke="${t.path.edge}" stroke-width="44"/>
    <polyline points="${pathPoints(0, width)}" fill="none" stroke="${t.path.top}" stroke-width="36"/>
    <g fill="${t.path.speck}">${specks}</g>
    <rect x="0" y="${CLIFF}" width="${width}" height="${H - CLIFF}" fill="${t.cliff.face}"/>
    <rect x="0" y="${CLIFF + 24}" width="${width}" height="4" fill="${t.cliff.dark}"/>
    <g fill="${t.cliff.stone}">${stones}</g>
    <path d="${lip}" fill="${t.cliff.lip}"/></svg>`;
}

// пещера
function caveSvg(t, c, seed) {
  const rand = rng(`cave${seed}${c.x0}`);
  const left = c.x0 - 60;
  const right = c.x1 + 60;
  const w = right - left;
  // гора
  const peaks = ridge(w, 64, 30, 8, `ct${seed}${c.x0}`, 1.5);
  const top = peaks.map(([x, y]) => {
    const edge = Math.max(0, Math.min(x, w - x)) / (w * 0.34);
    const slope = CLIFF - (CLIFF - 40) * Math.min(1, edge ** 0.8);
    return [x, Math.round(Math.max(y, slope) / 4) * 4];
  });
  let rock = `M0 ${CLIFF}`;
  top.forEach(([x, y], i) => { rock += ` L${x} ${y} L${top[i + 1] ? top[i + 1][0] : x} ${y}`; });
  rock += ` L${w} ${CLIFF} Z`;
  // свет и тень
  let light = '';
  let shade = '';
  top.forEach(([x, y], i) => {
    if (!top[i + 1]) return;
    const dx = top[i + 1][0] - x;
    if (x < w * 0.45) light += `<rect x="${x}" y="${y}" width="${dx}" height="${Math.max(0, Math.round((CLIFF - y) * 0.35))}"/>`;
    if (x > w * 0.62) shade += `<rect x="${x}" y="${y}" width="${dx}" height="${CLIFF - y}"/>`;
  });

  // вход
  const a0 = 40;
  const a1 = w - 40;
  const archTop = 132;
  let arch = `M${a0} ${CLIFF}`;
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const k = i / steps;
    const x = a0 + (a1 - a0) * k;
    const y = archTop + (CLIFF - archTop) * (1 - Math.sin(Math.PI * k) ** 0.5);
    arch += ` L${Math.round(x / 4) * 4} ${Math.round(y / 4) * 4}`;
  }
  arch += ` L${a1} ${CLIFF} Z`;

  let texture = '';
  for (let i = 0; i < w / 5; i++) {
    const x = Math.round(rand() * w);
    const col = top[Math.min(top.length - 1, Math.round(x / 8))][1];
    texture += `<rect x="${x}" y="${Math.round(col + 8 + rand() * (CLIFF - col - 8))}" width="${4 + Math.round(rand() * 10)}" height="4"/>`;
  }
  let lip = '';
  top.forEach(([x, y], i) => { if (top[i + 1]) lip += `<rect x="${x}" y="${y}" width="${top[i + 1][0] - x}" height="${rand() < 0.5 ? 8 : 4}"/>`; });

  // сталактиты
  let stal = '';
  for (let x = a0 + 24; x < a1 - 24; x += 16 + rand() * 14) {
    const k = (x - a0) / (a1 - a0);
    const y = archTop + (CLIFF - archTop) * (1 - Math.sin(Math.PI * k) ** 0.5) - 2;
    if (y > 230) continue;
    const len = 10 + Math.round(rand() * 22);
    stal += `<path d="M${x - 6} ${y} L${x + 6} ${y} L${x + 4} ${y + len * 0.5} L${x + 2} ${y + len * 0.5} L${x + 1} ${y + len} L${x - 1} ${y + len} L${x - 2} ${y + len * 0.5} L${x - 4} ${y + len * 0.5} Z"/>`;
  }
  const inPts = [];
  for (let x = c.x0 + 30; x <= c.x1 - 30; x += 16) inPts.push(`${x - left},${groundY(x)}`);

  return `<svg class="tw-cave" style="left:${left}px" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" shape-rendering="crispEdges" aria-hidden="true">
    <defs>
      <radialGradient id="cg${c.x0}" cx="50%" cy="80%" r="60%">
        <stop offset="0" stop-color="#2B2450"/><stop offset="1" stop-color="#0D0A18"/></radialGradient>
      <clipPath id="ca${c.x0}"><path d="${arch}"/></clipPath>
    </defs>
    <path d="${rock}" fill="${t.cave.rock}"/>
    <g fill="#FFFFFF" opacity=".12">${light}</g>
    <g fill="#000000" opacity=".16">${shade}</g>
    <g fill="${t.cave.rockDark}">${texture}</g>
    <g fill="${t.cave.lip}">${lip}</g>
    <path d="${arch}" fill="url(#cg${c.x0})"/>
    <g clip-path="url(#ca${c.x0})">
      <rect x="0" y="${PATH_Y + 10}" width="${w}" height="${CLIFF - PATH_Y}" fill="#1E1934"/>
      <polyline points="${inPts.join(' ')}" fill="none" stroke="#3A3155" stroke-width="40"/>
      <polyline points="${inPts.join(' ')}" fill="none" stroke="#4B4475" stroke-width="30"/>
    </g>
    <g fill="${t.cave.rock}">${stal}</g>
    <path d="${arch}" fill="none" stroke="${t.cave.rockDark}" stroke-width="6"/>
  </svg>`;
}

function inCave(caves, x) {
  return caves.some((c) => x > c.x0 - 70 && x < c.x1 + 70);
}

function put(name, x, y, scale, pal = {}, cls = '') {
  return `<span class="decor ${cls}" style="left:${Math.round(x)}px;top:${Math.round(y)}px;z-index:${Math.round(y)}">${sprite(name, '', pal, scale)}</span>`;
}

function decorHtml(t, width, caves, seed) {
  const rand = rng(`d${seed}`);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  let html = '';
  // дальние деревья
  for (let x = 0; x < width; x += 34 + rand() * 30) {
    if (inCave(caves, x)) continue;
    const [name, pal] = pick(t.trees);
    html += put(name, x, 206 + rand() * 14, 2, pal, 'back');
  }
  for (let x = 10; x < width; x += 46) {
    const y = groundY(x);
    if (inCave(caves, x)) continue;
    // деревья за тропой
    if (rand() < 0.55) {
      const [name, pal] = pick(t.trees);
      html += put(name, x + rand() * 24, y - 34 - rand() * 14, 3, pal);
    }
    // перед тропой
    if (rand() < 0.65) {
      const [name, pal] = pick(t.near);
      html += put(name, x + rand() * 24, Math.min(CLIFF - 2, y + 98 + rand() * 10), 3, pal);
    }
  }
  // кристаллы и факелы
  for (const c of caves) {
    for (let x = c.x0 + 20; x < c.x1 - 20; x += 30 + rand() * 30) {
      html += put('crystal', x, Math.min(CLIFF - 4, groundY(x) + 70 + rand() * 18), 3, {}, 'glow');
    }
    html += put('torch', c.x0 - 6, 210, 3, {}, 'glow');
    html += put('torch', c.x1 + 6, 210, 3, {}, 'glow');
  }
  return html;
}

function fgHtml(t, w, seed) {
  const rand = rng(`fg${seed}`);
  let html = '';
  for (let x = 40; x < w; x += 220 + rand() * 260) {
    const [name, pal] = t.front[Math.floor(rand() * t.front.length)];
    html += `<span class="decor" style="left:${Math.round(x)}px;top:${H + 12}px">${sprite(name, '', pal, 5)}</span>`;
  }
  if (t.garland) {
    let d = '';
    let bulbs = '';
    for (let x = 0; x < w; x += 140) {
      d += `M${x} 6 Q${x + 70} 44 ${x + 140} 6 `;
      for (let k = 1; k < 7; k++) {
        const bx = x + k * 20;
        const by = Math.round(6 + 38 * (1 - ((bx - x - 70) / 70) ** 2) * 0.5 + 2);
        bulbs += `<rect class="bulb b${k % 4}" x="${bx - 2}" y="${by}" width="5" height="6"/>`;
      }
    }
    html += `<svg class="garland" width="${w}" height="60" shape-rendering="crispEdges"><path d="${d}" fill="none" stroke="#2C5E3E" stroke-width="3"/>${bulbs}</svg>`;
  }
  return html;
}

function particlesHtml(t, seed) {
  if (reduceMotion) return '';
  const rand = rng(`p${seed}`);
  const kind = t.particles;
  const count = kind === 'butterflies' ? 5 : kind === 'snow' ? 60 : 26;
  let html = '';
  for (let i = 0; i < count; i++) {
    const style = `left:${Math.round(rand() * 100)}%;animation-duration:${(6 + rand() * 9).toFixed(1)}s;animation-delay:-${(rand() * 12).toFixed(1)}s`;
    if (kind === 'butterflies') {
      html += `<span class="p-fly" style="${style};top:${120 + Math.round(rand() * 160)}px">${sprite('butterfly', '', { w: ['#F59AB0', '#F2C14E', '#86ACEB', '#FFFFFF'][i % 4] }, 2)}</span>`;
    } else {
      html += `<i class="p-${kind} c${i % 3}" style="${style}"></i>`;
    }
  }
  return html;
}

function hpBar(t) {
  return `<span class="t-hp kind-${t.kind}">${Array.from({ length: t.hp_total }, (_, i) =>
    `<i class="${i < t.hp_left ? 'full' : ''}"></i>`).join('')}</span>`;
}

function nodeHtml(n) {
  const z = `z-index:${n.y + 202}`; // подписи поверх декора
  const pos = `left:${n.x}px;top:${n.y}px;${z}`;
  if (n.type === 'fog') {
    return `<div class="tnode t-fog" style="${pos}">
      <div class="fog-cloud">${n.tasks.slice(0, 3).map((t) =>
        `<button class="t-fog-monster" data-open="${t.id}" title="${esc(t.title)}">${sprite(t.kind, 'fogged', {}, 2)}</button>`).join('')}</div>
      <span class="t-label">Туман: ${n.tasks.length}</span></div>`;
  }
  if (n.type === 'day') {
    const d = n.day;
    return `<div class="tnode t-day ${d.is_today ? 'today' : ''}" style="${pos}">
      <span class="t-sign"><b>${d.weekday}</b><small>${d.is_today ? 'сегодня' : d.label}</small></span>
      <button class="t-rest ${d.rest ? 'on' : ''}" data-rest="${d.date}" aria-pressed="${d.rest}"
              title="${d.rest ? 'Убрать привал' : 'Сделать днём привала'}">${sprite('tent', '', {}, 1)}</button>
    </div>`;
  }
  if (n.type === 'camp') {
    return `<div class="tnode t-camp" data-camp="${n.day.date}" style="${pos}">${sprite('campfire', '', {}, 3)}${sprite('tent', '', {}, 3)}
      <span class="t-label">Привал</span></div>`;
  }
  if (n.type === 'quiet') return `<div class="tnode t-quiet" style="${pos}"><span class="t-label">тихо</span></div>`;
  if (n.type === 'horizon') {
    const more = n.ahead.length;
    return `<div class="tnode t-horizon" style="${pos}">${sprite('door', '', {}, 3)}
      <span class="t-label">${more ? `Дальше: ${more}` : 'Конец недели'}</span></div>`;
  }

  const t = n.task;
  const left = n.items.filter((i) => !i.done).length;
  if (n.type === 'dummy') {
    return `<button class="tnode t-monster t-dummy ${n.cleared ? 'passed' : ''}" style="${pos}"
        data-open="${t.id}" data-task="${t.id}" aria-label="Тренировка: ${esc(t.title)}">
        <span class="t-body">${sprite('dummy', '', {}, 3)}<span class="t-badge">${sprite(t.kind, '', {}, 1)}</span></span>
        <span class="t-label">Тренировка</span>
        <span class="t-sub">${esc(t.title)}</span>
        ${n.cleared ? '<span class="t-note">готово</span>' : left > 1 ? `<span class="t-note">тренировок: ${left}</span>` : ''}
      </button>`;
  }
  if (n.type === 'track') {
    return `<button class="tnode t-monster t-track ${n.cleared ? 'passed' : ''}" style="${pos}"
        data-open="${t.id}" data-task="${t.id}" aria-label="${esc(t.title)}">
        <span class="t-body">${sprite('track', '', {}, 3)}<span class="t-badge">${sprite(t.kind, '', {}, 1)}</span></span>
        <span class="t-label">${esc(t.title)}</span>
        <span class="t-sub">ещё ${left || n.items.length} уд.</span>
      </button>`;
  }
  const dead = t.status === 'done';
  const state = dead ? 'dead' : n.cleared ? 'passed' : '';
  const pic = dead ? sprite('bones', '', {}, 3) : sprite(t.kind, '', {}, n.battle && t.kind === 'boss' ? 4 : 3);
  return `<button class="tnode t-monster kind-${t.kind} ${state} ${n.battle ? 'battle' : ''}" style="${pos}"
      data-open="${t.id}" data-task="${t.id}" aria-label="${esc(t.title)}">
      <span class="t-body">${pic}</span>
      <span class="t-label">${esc(t.title)}</span>
      ${dead ? '<span class="t-note">повержен</span>' : n.cleared ? '<span class="t-note">на сегодня всё</span>'
        : `${hpBar(t)}${left > 1 ? `<span class="t-note">ударов сегодня: ${left}</span>` : ''}`}
    </button>`;
}

function bubbleText(step) {
  if (step.is_training || step.is_battle) return step.step;
  return `Ударить: ${step.step}`;
}

export function renderTrail(root, S) {
  registerScenery();
  const season = seasonFor(S.today);
  const t = THEMES[season];
  const { nodes, width } = buildNodes(S);
  const hero = findHero(nodes);
  hero.y = groundY(hero.x);
  const caves = findCaves(nodes, width);
  const seed = S.today.slice(0, 7);

  let world = root.querySelector('.trail-world');
  if (!world || world.dataset.season !== season) {
    root.innerHTML = `<div class="trail-world season-${season}" data-season="${season}">
      <div class="tw-sky"></div>
      <div class="tw-layer tw-far"></div>
      <div class="tw-layer tw-hills"></div>
      <div class="trail-scroll" tabindex="0" aria-label="Карта похода, листается вбок">
        <div class="trail-scene"><div class="tw-static"></div><div id="trail-hero" class="trail-hero"></div></div>
      </div>
      <div class="tw-layer tw-fg"></div>
      <div class="tw-particles"></div>
      <span class="tw-season">${t.name}</span>
    </div>`;
    world = root.querySelector('.trail-world');
    heroPos = null;
    const scroll = world.querySelector('.trail-scroll');
    const move = () => {
      const s = scroll.scrollLeft;
      for (const [name, k] of Object.entries(PARALLAX)) {
        world.querySelector(`.tw-${name}`).style.transform = `translateX(${-Math.round(s * k)}px)`;
      }
    };
    scroll.addEventListener('scroll', () => requestAnimationFrame(move), { passive: true });
  }

  const vw = root.clientWidth || 900;
  const span = (k) => Math.round(vw + Math.max(0, width - vw) * k) + 40;
  world.style.setProperty('--sky-top', t.sky[0]);
  world.style.setProperty('--sky-bottom', t.sky[1]);
  world.querySelector('.tw-sky').innerHTML = skyHtml(t, vw, seed);
  world.querySelector('.tw-far').innerHTML = farSvg(t, span(PARALLAX.far), seed);
  world.querySelector('.tw-hills').innerHTML = hillsSvg(t, span(PARALLAX.hills), seed);
  world.querySelector('.tw-fg').innerHTML = fgHtml(t, span(PARALLAX.fg), seed);
  world.querySelector('.tw-particles').innerHTML = particlesHtml(t, seed);

  const scene = world.querySelector('.trail-scene');
  scene.style.width = `${width}px`;
  scene.querySelector('.tw-static').innerHTML = groundSvg(t, width, seed)
    + caves.map((c) => caveSvg(t, c, seed)).join('')
    + decorHtml(t, width, caves, seed)
    + nodes.map(nodeHtml).join('');

  const h = S.hero;
  const heroEl = scene.querySelector('#trail-hero');
  const items = hero.target ? hero.target.items : [];
  const step = items.find((i) => !i.done && !i.is_battle) || items.find((i) => !i.done);
  const moved = heroPos && (heroPos.x !== hero.x || heroPos.y !== hero.y);
  const walk = moved && !reduceMotion;
  const token = ++walkToken;
  heroEl.classList.remove('visiting');
  heroEl.style.transitionDuration = '';
  // сначала идёт к костру, потом садится
  heroEl.classList.toggle('sitting', Boolean(hero.sit && !walk));
  heroEl.innerHTML = `
    ${h.pet ? `<span class="t-pet">${sprite(h.pet, '', {}, 2)}</span>` : ''}
    <span class="t-hero-body">${hero.sit && !walk ? heroSitSprite(h, 'trail') : heroSprite(h, 'trail')}</span>
    ${step ? `<button class="trail-bubble ${step.is_battle ? 'battle' : ''}" data-hit="${step.step_id}">${esc(bubbleText(step))}</button>`
      : `<span class="trail-bubble calm">${S.days[0].rest ? 'Привал' : 'На сегодня всё'}</span>`}`;

  if (walk) {
    heroEl.classList.add('walking');
    heroEl.classList.toggle('back', hero.x < heroPos.x);
    footsteps(WALK_MS);
    setTimeout(() => {
      if (token !== walkToken) return;
      heroEl.classList.remove('walking', 'back');
      if (hero.sit) sitDown(heroEl, h);
    }, WALK_MS);
  }
  heroEl.style.left = `${hero.x}px`;
  heroEl.style.top = `${hero.y}px`;
  heroEl.style.zIndex = hero.y + 203;
  heroPos = { x: hero.x, y: hero.y };

  const scroll = world.querySelector('.trail-scroll');
  const want = Math.max(0, Math.min(hero.x - scroll.clientWidth * 0.3, scroll.scrollWidth - scroll.clientWidth));

  // чтобы облачко не вылезало за край
  const bubble = heroEl.querySelector('.trail-bubble');
  if (bubble) {
    bubble.style.setProperty('--shift', '0px');
    const r = bubble.getBoundingClientRect();
    const left = r.left - scene.getBoundingClientRect().left;
    const shift = Math.max(0, want + 8 - left) - Math.max(0, left + r.width - (want + scroll.clientWidth - 8));
    bubble.style.setProperty('--shift', `${Math.round(shift)}px`);
  }
  scroll.scrollTo({ left: want, behavior: moved && !reduceMotion ? 'smooth' : 'auto' });
  scroll.dispatchEvent(new Event('scroll'));
}

function footsteps(ms) {
  let ticks = 0;
  const timer = setInterval(() => { play('step'); if (++ticks >= ms / 220) clearInterval(timer); }, 200);
}

function sitDown(heroEl, h) {
  heroEl.querySelector('.t-hero-body').innerHTML = heroSitSprite(h, 'trail');
  heroEl.classList.add('sitting');
}

// герой идёт к костру, сидит и возвращается
export async function trailVisitCamp(root, date, h) {
  if (reduceMotion || !root || root.hidden) return;
  const heroEl = root.querySelector('#trail-hero');
  const camp = root.querySelector(`.t-camp[data-camp="${date}"]`);
  if (!heroEl || !camp || heroEl.classList.contains('sitting')) return;
  const token = ++walkToken;
  const scroll = root.querySelector('.trail-scroll');
  const body = heroEl.querySelector('.t-hero-body');
  const standing = body.innerHTML;
  const home = { x: parseFloat(heroEl.style.left), y: parseFloat(heroEl.style.top) };
  const seat = { x: parseFloat(camp.style.left) - CAMP_SEAT, y: parseFloat(camp.style.top) };
  const ms = Math.round(Math.min(2600, Math.max(800, Math.abs(seat.x - home.x) * 2)));

  const go = (to, from) => {
    heroEl.style.transitionDuration = `${ms}ms`;
    heroEl.classList.add('walking', 'visiting');
    heroEl.classList.toggle('back', to.x < from.x);
    heroEl.style.left = `${to.x}px`;
    heroEl.style.top = `${to.y}px`;
    heroEl.style.zIndex = Math.round(to.y) + 203;
    scroll.scrollTo({ left: Math.max(0, to.x - scroll.clientWidth * 0.4), behavior: 'smooth' });
    footsteps(ms);
  };

  go(seat, home);
  await wait(ms);
  if (token !== walkToken) return;
  heroEl.classList.remove('walking', 'back');
  sitDown(heroEl, h);
  await wait(2600);
  if (token !== walkToken) return;
  heroEl.classList.remove('sitting');
  body.innerHTML = standing;
  go(home, seat);
  await wait(ms);
  if (token !== walkToken) return;
  heroEl.classList.remove('walking', 'back', 'visiting');
  heroEl.style.transitionDuration = '';
}

// анимация удара
export async function trailHit(root, taskId, victory) {
  if (reduceMotion || !root || root.hidden) return;
  const heroEl = root.querySelector('#trail-hero');
  const mon = root.querySelector(`.t-monster[data-task="${taskId}"]:not(.passed):not(.dead)`);
  if (!heroEl || !mon) return;
  heroEl.classList.add('attack');
  await new Promise((r) => setTimeout(r, 160));
  mon.classList.add('hurt');
  await new Promise((r) => setTimeout(r, 260));
  heroEl.classList.remove('attack');
  if (victory && !mon.classList.contains('t-dummy')) {
    mon.classList.add('shatter');
    await new Promise((r) => setTimeout(r, 650));
  }
}

export function resetTrail() {
  heroPos = null;
}
