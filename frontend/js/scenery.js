// времена года на карте
// можно проверить так: ?season=winter (spring, summer, autumn, newyear)
import { registerSprite } from './sprites.js?v=9';

export function seasonFor(iso) {
  let forced = null;
  try { forced = new URLSearchParams(location.search).get('season'); } catch { forced = null; }
  if (forced && THEMES[forced]) return forced;
  const [, m, d] = iso.split('-').map(Number);
  // новый год с 25 декабря по 8 января
  if ((m === 12 && d >= 25) || (m === 1 && d <= 8)) return 'newyear';
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'spring';
  if (m <= 8) return 'summer';
  return 'autumn';
}

const PINE = { l: '#5DAE52', g: '#3F8C3E', G: '#2C6531' };
const PINE_DARK = { l: '#3F7A52', g: '#2C5E3E', G: '#1E4530' };

export const THEMES = {
  spring: {
    name: 'Весна',
    sky: ['#8EC9EA', '#DDF1F6'], sun: { color: '#FFF4C2', x: 0.78, y: 46 }, stars: false,
    clouds: '#FFFFFF',
    far: '#9CC3C9', farSnow: '#E9F3F5', hills: '#79B77E', hillsDark: '#5E9E66',
    ground: ['#86C96F', '#5DAE52'], tuft: '#4E9A45',
    path: { edge: '#6B4A2A', top: '#A07A4C', speck: '#8A6440' },
    cliff: { face: '#7A5636', dark: '#5E3B22', stone: '#9C96B8', lip: '#5DAE52' },
    cave: { rock: '#7D7598', rockDark: '#5A5277', lip: '#5DAE52' },
    trees: [['oak', { l: '#FFE0EC', g: '#F7A8C4', G: '#D27A9C' }], ['oak', { l: '#9FE08A', g: '#6CC060', G: '#468F43' }], ['pine', PINE]],
    near: [['tulip', { r: '#E0605A', R: '#A3352F' }], ['tulip', { r: '#F2C14E', R: '#C7922A' }], ['daisy', {}], ['bush', {}], ['rock', {}]],
    front: [['bush', {}], ['daisy', {}], ['tulip', { r: '#F59AB0', R: '#C96C8A' }]],
    particles: 'petals',
  },
  summer: {
    name: 'Лето',
    sky: ['#4FA8E6', '#C3E8F8'], sun: { color: '#FFE36E', x: 0.7, y: 40 }, stars: false,
    clouds: '#FFFFFF',
    far: '#7FAFC2', farSnow: '#DCEAF0', hills: '#4F9A55', hillsDark: '#3F8445',
    ground: ['#5FBA52', '#3F9A40'], tuft: '#348A37',
    path: { edge: '#6B4A2A', top: '#B08654', speck: '#8A6440' },
    cliff: { face: '#7A5636', dark: '#5E3B22', stone: '#9C96B8', lip: '#3F9A40' },
    cave: { rock: '#7D7598', rockDark: '#5A5277', lip: '#3F9A40' },
    trees: [['oak', { l: '#7BC96F', g: '#4E8F47', G: '#33632F' }], ['pine', PINE], ['oak', { l: '#9BD65C', g: '#5FA83A', G: '#3D7A27' }]],
    near: [['sunflower', {}], ['bush', { l: '#7BC96F', g: '#4E8F47', G: '#C9473F' }], ['daisy', {}], ['mushroom', {}], ['rock', {}]],
    front: [['bush', {}], ['sunflower', {}], ['daisy', {}]],
    particles: 'butterflies',
  },
  autumn: {
    name: 'Осень',
    sky: ['#D9785C', '#F8D3A0'], sun: { color: '#FFD08A', x: 0.82, y: 70 }, stars: false,
    clouds: '#F6C2A4',
    far: '#B78B8A', farSnow: '#E7CDC3', hills: '#B8763E', hillsDark: '#8E5A33',
    ground: ['#C2A64E', '#9C8240'], tuft: '#7E6A30',
    path: { edge: '#5E3B22', top: '#8A6440', speck: '#6B4A2A' },
    cliff: { face: '#6B4A2A', dark: '#4A3424', stone: '#8E86A8', lip: '#9C8240' },
    cave: { rock: '#7A6E86', rockDark: '#564A66', lip: '#C2A64E' },
    trees: [['oak', { l: '#F7C35E', g: '#E8873A', G: '#B5532A' }], ['oak', { l: '#F08A6A', g: '#C9473F', G: '#8E2C27' }], ['pine', PINE_DARK], ['bare', {}]],
    near: [['pumpkin', {}], ['leafpile', {}], ['mushroom', {}], ['rock', {}]],
    front: [['leafpile', {}], ['pumpkin', {}], ['mushroom', {}]],
    particles: 'leaves',
  },
  winter: {
    name: 'Зима',
    sky: ['#141A33', '#3B4F7E'], moon: { color: '#F4F1DC', x: 0.8, y: 50 }, stars: true,
    clouds: null,
    far: '#5C6E99', farSnow: '#DCE6F2', hills: '#B7C6DD', hillsDark: '#93A6C4',
    ground: ['#E3EBF5', '#C9D6E8'], tuft: '#AFC0D8',
    path: { edge: '#8E9FB8', top: '#B9C6D8', speck: '#A3B2C8' },
    cliff: { face: '#6B5A4E', dark: '#4A3E38', stone: '#8E86A8', lip: '#F4F8FF' },
    cave: { rock: '#6E6890', rockDark: '#4B4475', lip: '#F4F8FF' },
    trees: [['pineSnow', {}], ['pineSnow', {}], ['bare', {}]],
    near: [['snowdrift', {}], ['rock', { a: '#F4F8FF', c: '#9C96B8', d: '#6E6890' }], ['snowdrift', {}]],
    front: [['snowdrift', {}], ['pineSnow', {}]],
    particles: 'snow',
  },
};
THEMES.newyear = {
  ...THEMES.winter,
  name: 'Новый год',
  trees: [['xmas', {}], ['pineSnow', {}], ['xmas', {}], ['bare', {}]],
  near: [['gift', { c: '#C9473F', C: '#8E2C27' }], ['gift', { c: '#4F7CC9', C: '#355A97' }], ['snowman', {}], ['snowdrift', {}], ['gift', { c: '#4E8F47', C: '#33632F' }]],
  front: [['snowman', {}], ['gift', { c: '#7A4FC9', C: '#55348F' }], ['snowdrift', {}]],
  garland: true,
};

const XMAS_ROWS = [
  '......Y......',
  '.....YyY.....',
  '......l......',
  '.....lgg.....',
  '....lgrgG....',
  '.....lgG.....',
  '....lggbg....',
  '...lgygGGg...',
  '....lggGG....',
  '...lrgggbGg..',
  '..lgggyGGGg..',
  '...lggGGGg...',
  '..lbgggGrGGg.',
  '.lgggrgGGGGg.',
  'lggyggggbGGGg',
  '......n......',
  '.....nnn.....',
];
// мигающие огоньки
const XMAS_BLINK = Object.fromEntries(XMAS_ROWS.map((r, i) => [i, r.replace(/[ryb]/g, (c) => ({ r: 'y', y: 'b', b: 'r' }[c]))]));

const SCENERY = {
  pineSnow: { pal: { ...PINE_DARK, w: '#F4F8FF', W: '#C9D6EA', b: '#6B4A2A' }, rows: [
    '.....w.....', '....wgg....', '...wwgGg...', '....lgG....', '...wwwGg...', '..lgggGGg..', '..wwwwGGW..',
    '..lgggGGg..', '.wwwwwGGWW.', '..lgggGGg..', '.wwwwwwGWW.', 'lgggggGGGGg', '.....b.....', '.....b.....', '....bbb....'] },
  bare: { pal: { b: '#6B4A2A', B: '#4A3424' }, rows: [
    '..b.....b....', '...b...b..b..', 'b..bb.b..b...', '.b..bbb.b....', '..b..bbb...b.', '...bb.bb..b..',
    '......bbbb...', '.....bBb.....', '......bB.....', '......bB.....', '......bB.....', '......bB.....',
    '.....bbBB....', '....bbBBBB...'] },
  tulip: { pal: { r: '#E0605A', R: '#A3352F', g: '#4E8F47' }, rows: [
    'r.r.r', 'rrrrR', '.rrR.', '..g..', 'g.g..', '.gg..', '..g..'] },
  daisy: { pal: { w: '#FFFFFF', y: '#F2C14E', g: '#4E8F47' }, rows: [
    '.w...w.', 'wyw.wyw', '.w.g.w.', '.g.g.g.'] },
  sunflower: { pal: { y: '#F2C14E', o: '#E8873A', n: '#6B4A2A', g: '#4E8F47', G: '#33632F' }, rows: [
    '.yy.yy.', 'yoyyyoy', 'yynnnyy', '.ynnny.', 'yynnnyy', 'yoyyyoy', '.yy.yy.', '...g...', '.ggg...',
    '...gGG.', '...g...', '..ggg..'] },
  pumpkin: { pal: { o: '#E8873A', O: '#B5532A', y: '#F7C35E', g: '#4E8F47', n: '#6B4A2A' }, rows: [
    '....ng...', '...ng....', '.ooyoooO.', 'oyooyooOO', 'oyooyooOO', 'ooooooOOO', '.OOOOOOO.'] },
  leafpile: { pal: { o: '#E8873A', r: '#C9473F', y: '#F2C14E', n: '#8A5A33' }, rows: [
    '...ro.y....', '.oyrorroy..', 'ryoorynoory', 'nnrononnnrn'] },
  snowdrift: { pal: { w: '#F4F8FF', W: '#C9D6EA', B: '#A9B8D0' }, rows: [
    '....wwwww.....', '..wwwwwwwwW...', '.wwwwwwwwwwWW.', 'wwwwwwwwwwWWWW', 'WWWWWWWWWBBBBB'] },
  snowman: { pal: { w: '#F4F8FF', W: '#C9D6EA', k: '#1A1426', o: '#F2A541', r: '#C9473F', R: '#8E2C27', n: '#6B4A2A', h: '#2A2346' }, rows: [
    '...hhhhh...', '...hhhhh...', '..hhhhhhh..', '...wwwww...', '..wwkwkWW..', '..wwwwooo..', '...wwwWW...',
    '..rrrrrRR..', 'n.wwrwwwWWn', '.nwwrkwwWn.', '..wwwwwwWW.', '.wwwwkwwwWW', '.wwwwwwwwWW', '.wwwwkwwwWW',
    '..wwwwwwWW.', '...WWWWWW..'] },
  gift: { pal: { c: '#C9473F', C: '#8E2C27', y: '#F2C14E', Y: '#C7922A' }, rows: [
    '..y..y..', '...yy...', 'ccccyccC', 'ccccyccC', 'yyyyyyyY', 'ccccyccC', 'ccccyccC', 'CCCCYCCC'] },
  xmas: { pal: { ...PINE_DARK, Y: '#F2C14E', y: '#FFE36E', r: '#E0605A', b: '#6FD6FF', n: '#6B4A2A' },
    rows: XMAS_ROWS, loop: true, frames: [XMAS_BLINK] },
  butterfly: { pal: { w: '#F59AB0', k: '#1A1426' }, loop: true,
    rows: ['ww.ww', 'wwkww', '.wkw.', '..k..'], frames: [{ 0: '..k..', 1: '.wkw.', 2: '.wkw.' }] },
};

let registered = false;
export function registerScenery() {
  if (registered) return;
  registered = true;
  for (const [name, def] of Object.entries(SCENERY)) registerSprite(name, def);
}

// случайные числа, но каждый раз одинаковые
export function rng(seed) {
  let a = 0;
  for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// горы ступеньками
export function ridge(width, base, amp, step, seed, freq = 1) {
  const rand = rng(seed);
  const p1 = rand() * 6;
  const p2 = rand() * 6;
  const pts = [];
  for (let x = 0; x <= width + step; x += step) {
    const n = Math.sin(x / (160 / freq) + p1) * 0.6 + Math.sin(x / (61 / freq) + p2) * 0.3 + (rand() - 0.5) * 0.25;
    const y = Math.round((base - amp * (n + 1) / 2) / 4) * 4;
    pts.push([x, y]);
  }
  return pts;
}

export function ridgePolygon(pts, bottom) {
  let d = `M0 ${bottom} `;
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const nx = pts[i + 1] ? pts[i + 1][0] : x;
    d += `L${x} ${y} L${nx} ${y} `;
  }
  return `${d}L${pts[pts.length - 1][0]} ${bottom} Z`;
}

// снег на вершинах
export function snowCaps(pts, limit) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    if (y < limit) d += `M${x} ${y}h${pts[i + 1][0] - x}v8h-${pts[i + 1][0] - x}Z `;
  }
  return d;
}
