// спрайты: строка - ряд пикселей, буква - цвет, точка - пусто
// чёрный контур рисуется сам. посмотреть все: /sprites.html

const OUTLINE = '#140F22';

const SPRITES = {
  slime: {
    pal: { a: '#D6F7C2', b: '#9BE08A', c: '#6CC060', d: '#468F43', e: '#2C6531', w: '#FFFFFF', k: '#1A1426', m: '#7A2E3A', p: '#F59AB0' },
    rows: [
      '......bbbb....',
      '....bbaabbc...',
      '...bbaabbbcc..',
      '..bbabbbbbccc.',
      '.bbbbbbbbbccc.',
      '.bbkwbbbkwccd.',
      'cbkkbbbbkkcccd',
      'cbbbbmmmbbcccd',
      'ccbbbmpmbccccd',
      'cccccccccccddd',
      'dccccccccccddd',
      '.ddddccdddddd.',
      '..eed..dde.ee.',
    ],
  },
  goblin: {
    pal: { a: '#B4E69A', b: '#7BC96F', c: '#4E8F47', y: '#F2C14E', k: '#1A1426', w: '#FFFFFF',
           l: '#A8774A', t: '#8A5A33', s: '#5E3B22', n: '#3A2E5C', g: '#DDE3EE', h: '#8E86B8' },
    rows: [
      '....aabbbc....',
      '...abbbbbbc...',
      'abbbbbbbbbbbcc',
      '.abbykbbykbcc.',
      '..bbbbccbbbc..',
      '..bbkwkwkwbc..',
      '...cbbbbbcc...',
      '....lttttt....',
      '..blltttttsbg.',
      '..bltnnnntsbg.',
      '..clttttytsby.',
      '...ltttttts.h.',
      '...lts..lts...',
      '...bc....bc...',
      '..ss....ss....',
    ],
  },
  troll: {
    pal: { a: '#CFC9EC', b: '#A39CCB', c: '#8E86B8', d: '#6A6296', e: '#4B4475', y: '#F2C14E', k: '#1A1426',
           w: '#FFFFFF', h: '#EDE3C8', H: '#B8A98A', n: '#8A5A33', m: '#5E3B22' },
    rows: [
      '..h..........h..',
      '..hH.bbbbbb.Hh..',
      '...Hbaabbbbcd...',
      '...baabbbbbccd..',
      '...bbykbbykccd..',
      '...bbbbccbbccd..',
      '...bwcwccwcwcd..',
      '..dcccccccccdd..',
      '.bbcccccccccccd.',
      'bbcbccccccccdcdd',
      'bcc.ccccccccd.dd',
      'bcc.nnnnnnnn.dd.',
      'cc..nnmnnmnn..dd',
      '....nmnnnnmn....',
      '....ccc..ccd....',
      '...dccc..cccd...',
      '..eeee....eeee..',
    ],
  },
  boss: {
    pal: { a: '#FFA99E', b: '#F07A68', c: '#D24E46', d: '#A3352F', e: '#6E1F1E', y: '#F2C14E', Y: '#C7922A',
           g: '#6FD6FF', w: '#FFFFFF', k: '#1A1426', o: '#FFE36E', h: '#EDE3C8', p: '#3A2E5C', P: '#251C40' },
    rows: [
      '....y..y..y..y....',
      '....yYyyYyyYyyY...',
      '....yyyygyyygyyy..',
      '....YYYYYYYYYYYY..',
      '.h..abbbbbbbbbcd.h',
      '.hh.bboocbbbooccdh',
      '..hbbbcccbbccccdh.',
      '...bbwcwcwcwcwcd..',
      '...cbwkkkkkkkwcd..',
      '...dccwcwcwcwccd..',
      '..PdddccccccccddP.',
      '.PpbbccccyccccdpP.',
      'PppbccccccccccdppP',
      'PpbbccccccccccdppP',
      'Ppbc.cccccccc.cdpP',
      'Pp.c.ddccccdd.c.pP',
      'PP...ddd..ddd...PP',
      'P...eeee..eeee...P',
    ],
  },

  guard: {
    pal: { r: '#C9473F', a: '#E2E6EF', S: '#A9B0C2', T: '#6E7690', b: '#EDE3C8', B: '#B8A98A', k: '#1A1426',
           y: '#6FD6FF', s: '#3E5FA8', d: '#2A4178', o: '#F2C14E', h: '#8A5A33' },
    rows: [
      '........rr......',
      '........rrr.....',
      '.......SSSSa....',
      '......TSSSSSa...',
      '......TSSSSSS.a.',
      '......TykSykS.S.',
      '......TbbbbbT.h.',
      '.......bkbkb..h.',
      '..ss..SSSSSSS.h.',
      '.sssd.TSSaSSSTh.',
      '.soosbTSSSSSSTh.',
      '.sddsbTkkkkkkTh.',
      '.sssd.TSSSSSSTh.',
      '..sd..TTSSSSTTh.',
      '.......bB..bB.h.',
      '.......bB..bB.h.',
      '......TTT.TTT.h.',
      '......TTT.TTT...',
    ],
  },
  dummy: {
    pal: { S: '#D9C7A0', s: '#B8A580', k: '#5E3B22', n: '#8A5A33', Y: '#E8C66A', O: '#B8963F', r: '#C9473F', w: '#FFFFFF' },
    rows: [
      '....SSSS....',
      '...SSSSSs...',
      '...SkSSks...',
      '...SSSSSs...',
      '....SSss....',
      '.....nn.....',
      'nnnnYYYYnnnn',
      'n..YYYYYO..n',
      '...YrwwrO...',
      '...YwrrwO...',
      '...YrwwrO...',
      '...YYYYOO...',
      '....YYOO....',
      '.....nn.....',
      '.....nn.....',
      '.....nn.....',
      '...nnnnnn...',
      '..nnnnnnnn..',
    ],
  },
  track: {
    pal: { c: '#9C96B8', d: '#6E6890', k: '#3A2E5C' },
    rows: [
      '..cccccc..',
      '.cckcckcc.',
      'cckcccckcd',
      'cccckkcccd',
      'ccckkkkccd',
      'cccckkcccd',
      '.ddddddddd',
    ],
  },
  bat: {
    pal: { a: '#8C7CBC', c: '#4B3D78', d: '#2E2450', y: '#F2C14E', w: '#FFFFFF' },
    rows: [
      'c..........c',
      'cc..c..c..cc',
      'cac.cccc.cac',
      'caaccycyccac',
      'd.dccwcwcd.d',
      '....dccd....',
    ],
    loop: true,
    frames: [{
      0: '............',
      1: '....c..c....',
      2: '...acccccc..',
      4: 'cddccwcwcddc',
      5: 'c..dccccd..c',
    }],
  },
  cat: {
    pal: { a: '#FFC27A', o: '#F2A541', s: '#C77F26', w: '#FFFFFF', p: '#F59AB0', e: '#4E8F47' },
    rows: [
      'a....a......',
      'oa..ao......',
      'oooooo....s.',
      'oeooeo....s.',
      'owpwwosooos.',
      '.wwwwoosoos.',
      '..ooosoosoo.',
      '..oso.oso...',
      '..ww..ww....',
    ],
  },
  fox: {
    pal: { a: '#F5925E', r: '#D9682E', s: '#A8481C', w: '#FFFFFF', k: '#1A1426', n: '#3A2A1A' },
    rows: [
      'n..........n',
      'rn........nr',
      'rarr....rrsr',
      'rarrrrrrrrsr',
      'rrkwrrrrkwsr',
      'wrrrrrrrrrsw',
      '.wwwrnnrwww.',
      '..wwwwwwww..',
      '....wwww....',
    ],
  },

  slimeling: {
    pal: { a: '#FFE0EB', b: '#F59AB0', c: '#D86A8C', k: '#1A1426', w: '#FFFFFF' },
    rows: [
      '....bbbb....',
      '..bbaabbc...',
      '.babbbbbcc..',
      '.bkwbbkwccc.',
      'bbbbbbbbbccc',
      'cbbbbbbbcccc',
      '.cccccccccc.',
    ],
  },
  owl: {
    pal: { a: '#D9B48A', o: '#9C7448', s: '#6B4A2A', w: '#FFFFFF', y: '#F2C14E', k: '#1A1426', n: '#F2A541' },
    rows: [
      'so.......os',
      'sooooooooos',
      'owwwoowwwos',
      'owykwowykws',
      'owwwonowwws',
      'oaaoonooaos',
      'oaasaasaaos',
      'soaaaaaaaos',
      '.saasaasas.',
      '..ssssss...',
      '...y..y....',
    ],
  },
  ghost: {
    pal: { a: '#FFFFFF', b: '#E4E0F5', c: '#B7AFD9', k: '#1A1426' },
    rows: [
      '...bbbbb...',
      '..baaabbc..',
      '.baabbbbcc.',
      '.bakbbbkbc.',
      'bbbbbbbbbcc',
      'bbbbbkbbbcc',
      'bbbbbbbbbcc',
      'bbbbbbbbccc',
      'bcbbcbbcbcc',
      'c.ccc.ccc.c',
    ],
  },
  dragon: {
    pal: { a: '#9EF0D8', g: '#4FC4A6', d: '#2E8A78', y: '#F2C14E', k: '#1A1426', r: '#E0605A' },
    rows: [
      '.r.......gd...',
      'rrr.....aggd..',
      'rrrr...aggkgd.',
      'rrrrr..gggggyy',
      '.rrrrgggggdd..',
      '..rrgaggggd...',
      '...gaayyggd...',
      'd..gayyyggd...',
      'dd.ggyyggdd...',
      '.ddggggddd....',
      '...gd..gd.....',
    ],
  },
  mimic: {
    pal: { a: '#C99A64', b: '#8A5A33', B: '#5E3B22', y: '#F2C14E', Y: '#C7922A', k: '#1A1426',
           w: '#FFFFFF', p: '#E0605A', e: '#FFE36E' },
    rows: [
      '..aaaaaaaaaa..',
      '.abbbebbebbbB.',
      'abbbbbbbbbbbBB',
      'YwkwkwkwkwkwkY',
      'kkkkkkppkkkkkk',
      'kwkwkwpkwkwkwk',
      'abbbbbYyYbbbBB',
      'abbbbbbbbbbbBB',
      'YyyyyyyyyyyyyY',
      'BBBBBBBBBBBBBB',
    ],
  },

  // карта
  pine: {
    pal: { l: '#5DAE52', g: '#3F8C3E', G: '#2C6531', b: '#6B4A2A' },
    rows: [
      '.....l.....',
      '....lgg....',
      '...lggGg...',
      '....lgG....',
      '...lggGg...',
      '..lgggGGg..',
      '...lggGg...',
      '..lgggGGg..',
      '.lggggGGGg.',
      '..lgggGGg..',
      '.lggggGGGg.',
      'lgggggGGGGg',
      '.....b.....',
      '.....b.....',
      '....bbb....',
    ],
  },
  oak: {
    pal: { l: '#7BC96F', g: '#4E8F47', G: '#33632F', b: '#6B4A2A', B: '#4A3424' },
    rows: [
      '.....llgg......',
      '...lllggggg....',
      '..llggggggGG...',
      '.llgggggggGGG..',
      '.lgggggggggGGG.',
      'llggggggggGGGG.',
      'lgggggggggGGGGG',
      '.ggggggggGGGGG.',
      '..GgggGGGGGGG..',
      '....GGbGGG.....',
      '......bB.......',
      '......bB.......',
      '......bB.......',
      '.....bbBB......',
    ],
  },
  bush: {
    pal: { l: '#7BC96F', g: '#4E8F47', G: '#33632F' },
    rows: [
      '..llgg....',
      '.lgggggG..',
      'lgggggGGG.',
      'lggggGGGGG',
      '.GGGGGGGG.',
    ],
  },
  mushroom: {
    pal: { r: '#E0605A', R: '#A3352F', w: '#FFFFFF', s: '#EDE3C8' },
    rows: [
      '..rrr..',
      '.rwrrR.',
      'rrrrwRR',
      '.RRRRR.',
      '..sss..',
      '..sss..',
    ],
  },
  rock: {
    pal: { a: '#9C96B8', c: '#6E6890', d: '#4B4475' },
    rows: [
      '..aacc...',
      '.acccccd.',
      'acccccddd',
      'cccccdddd',
      '.dddddddd',
    ],
  },
  grass: {
    pal: { g: '#4E8F47', l: '#7BC96F' },
    rows: [
      'l..g.',
      'l.lg.',
      '.lggl',
    ],
  },
  crystal: {
    pal: { c: '#6FD6FF', C: '#3C88B5', w: '#DDF6FF' },
    loop: true,
    rows: [
      '..w...',
      '.wc...',
      '.cC.c.',
      'wcC.cC',
      'cCC.cC',
      'cCCwcC',
      'cCCcCC',
    ],
    frames: [{ 0: '......', 1: '.cc...', 3: 'ccC.wC' }],
  },
  campfire: {
    pal: { y: '#FFF3A8', Y: '#F2C14E', o: '#F2A541', r: '#E0605A', b: '#8A5A33', B: '#5E3B22', g: '#6E6890' },
    rows: [
      '.....r......',
      '....ror.....',
      '....oYor....',
      '...roYYo....',
      '...oYyYor...',
      '..roYyyYo...',
      '..bBoYYoBb..',
      '.bBbBbbBbBb.',
      'g.bBBbbBBb.g',
      '.gg......gg.',
    ],
    loop: true,
    frames: [{
      0: '......r.....',
      1: '.....ror....',
      2: '....roYo....',
      3: '....oYYor...',
      4: '...roYyYo...',
      5: '...oYyyYor..',
    }],
  },
  bones: {
    pal: { w: '#EDE3C8', W: '#B8A98A', k: '#1A1426' },
    rows: [
      '...wwww...',
      '..wwwwwW..',
      '..wkwwkW..',
      '..wwwwwW..',
      '...wWwW...',
      'Ww......wW',
      '..wW..wW..',
      '....wW....',
      '..Ww..Ww..',
      'wW......Ww',
    ],
  },
  torch: {
    pal: { y: '#FFF3A8', Y: '#F2C14E', o: '#F2A541', r: '#E0605A', b: '#8A5A33', B: '#5E3B22', g: '#6E6890' },
    rows: [
      '....r...',
      '...ro...',
      '..roor..',
      '..oYYo..',
      '.roYyYor',
      '.oYyyYo.',
      '..oYYo..',
      '..gggg..',
      '...bB...',
      '...bB...',
      '...bB...',
      '..gggg..',
      '...bB...',
    ],
    loop: true,
    frames: [{
      0: '...r....',
      1: '...or...',
      3: '.roYYo..',
      4: '.oYyYor.',
    }],
  },
  tent: {
    pal: { l: '#FFC27A', o: '#F2A541', s: '#C77F26', k: '#2A1F3D', p: '#8A5A33', r: '#E0605A' },
    rows: [
      '......pr......',
      '......prr.....',
      '......p.......',
      '.....los......',
      '....llosos....',
      '...llokosss...',
      '..llokkkooss..',
      '.llookkkkooss.',
      'lloookkkkkooss',
    ],
  },
  door: {
    pal: { g: '#7D77A3', G: '#4B4475', l: '#A8774A', b: '#8A5A33', B: '#5E3B22', i: '#3A2E5C', y: '#F2C14E' },
    rows: [
      '...gggggg...',
      '..gbllllBg..',
      '.gbllllllBg.',
      '.gblllllBBg.',
      'gbiiiiiiiiBg',
      'gblllllllBBg',
      'gbllllllyBBg',
      'gblllllyByBg',
      'gbllllllyBBg',
      'gbiiiiiiiiBg',
      'gblllllllBBg',
      'gbllllllBBBg',
      'GGGGGGGGGGGG',
    ],
  },
  chest: {
    pal: { a: '#C99A64', b: '#8A5A33', B: '#5E3B22', y: '#F2C14E', Y: '#C7922A', k: '#1A1426' },
    rows: [
      '..aaaaaaaaaa..',
      '.abbbbbbbbbbB.',
      'abbbbbbbbbbbBB',
      'YyyyyyyyyyyyyY',
      'abbbbbYyYbbbBB',
      'abbbbbYkYbbbBB',
      'abbbbbbbbbbbBB',
      'YyyyyyyyyyyyyY',
      'BBBBBBBBBBBBBB',
    ],
  },
};

// base - берём другой спрайт и меняем часть строк
function rowsOf(name, frame = 0) {
  const s = SPRITES[name];
  const rows = s.base ? rowsOf(s.base).map((row, i) => s.rows[i] ?? row) : s.rows;
  const over = frame ? framesOf(name)[frame - 1] : null;
  return over ? rows.map((row, i) => over[i] ?? row) : rows;
}

function framesOf(name) {
  const s = SPRITES[name];
  return s.frames ?? (s.base ? framesOf(s.base) : []);
}

function palOf(name) {
  const s = SPRITES[name];
  return s.base ? { ...palOf(s.base), ...(s.pal || {}) } : s.pal;
}

const cache = new Map();

export function spriteSVG(name, extra = {}, frame = 0) {
  const key = name + frame + JSON.stringify(extra);
  if (cache.has(key)) return cache.get(key);

  const rows = rowsOf(name, frame);
  const pal = { ...palOf(name), ...extra };
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const filled = (x, y) => y >= 0 && y < h && x >= 0 && x < w && pal[rows[y][x]] !== undefined;

  // +1 пиксель для контура
  let rects = '';
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      let color = null;
      if (filled(x, y)) color = pal[rows[y][x]];
      else if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) color = OUTLINE;
      if (color) rects += `<rect x="${x + 1}" y="${y + 1}" width="1.02" height="1.02" fill="${color}"/>`;
    }
  }
  const svg = `<svg class="f${frame}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 2} ${h + 2}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  cache.set(key, svg);
  return svg;
}

// масштаб только целый, иначе пиксели разные
const SCALE = { micro: 1, mini: 2, mid: 3, trail: 3, gear: 4, big: 7, sheet: 7, avatar: 2, pet: 2 };

function dims(name) {
  const rows = rowsOf(name);
  return [Math.max(...rows.map((r) => r.length)) + 2, rows.length + 2];
}


export function sprite(name, cls = '', extra = {}, scale = null) {
  const k = scale ?? cls.split(' ').map((c) => SCALE[c]).find(Boolean) ?? 2;
  const [w, h] = dims(name);
  const n = framesOf(name).length;
  let svgs = spriteSVG(name, extra);
  for (let f = 1; f <= n; f++) svgs += spriteSVG(name, extra, f);
  // анимация всегда (loop) или только при ходьбе
  const anim = n ? ` anim${SPRITES[name].loop ? ' loop' : ''}` : '';
  return `<span class="sprite${anim} ${cls}" style="width:${w * k}px;height:${h * k}px">${svgs}</span>`;
}

export function registerSprite(name, def) {
  if (!SPRITES[name]) SPRITES[name] = def;
}

// для sprites.html
export const ALL_SPRITES = Object.keys(SPRITES);
