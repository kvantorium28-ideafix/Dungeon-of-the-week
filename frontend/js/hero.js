// герой рисуется слоями: тело, голова, шлем, оружие
// все варианты можно посмотреть на /sprites.html
import { registerSprite, sprite } from './sprites.js?v=9';

const W = 26;
const HEAD_ROWS = 25;   // голова с шеей - строки 0-24, дальше тело

const BODY_PAL = {
  k: '#1A1426', f: '#F6D2B0', F: '#E0AE8A',
  S: '#C9CED8', T: '#8E95A6', a: '#F4F6FA',
  n: '#5E3B22', y: '#F2C14E', q: '#4B4475', Q: '#2E2850', m: '#5E3B22', M: '#3A2416',
};
const FACE_PAL = {
  r: '#6B4226', R: '#4A2D1A', h: '#9A6438', f: '#F6D2B0', F: '#E0AE8A', B: '#4A2D1A',
  k: '#2A1B14', w: '#FFFFFF', W: '#FFFFFF', E: '#3E5FA8', e: '#6FA3E0', p: '#F4A3A3', m: '#C25B5B', M: '#8E3B3B',
};
const GIRL_FACE = {
  r: '#8A4B2A', R: '#5E3019', h: '#B06A3C', B: '#6E3A20', k: '#2A1620',
  E: '#2F6E4A', e: '#6CBF7C', p: '#F59BAE', m: '#E0647C', M: '#B04560',
};

// тело. рука в 29 строке, там же оружие
const BODY = [
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '...........uuXFFXUu.......',
  '.........uuuXXUUUUUUUU....',
  '........uuuuXUUUyUUUUUUu..',
  '........uuuuXUUUUUUuUUUUu.',
  '.......uuuuuXnnnynnnuUffF.',
  '.......uuuuuXUUUUUUUu.....',
  '......uuuuuXUUUUUUUUUu....',
  '......uuuu.uXXUUUUUuu.....',
  '......uuu...qqqQ.qqQ......',
  '......uu....qqqQ.qqQ......',
  '.....u......qqQ..qqQ......',
  '............mmM..mmmM.....',
  '...........mmmM..mmmmM....',
  '...........MMMM..MMMMM....',
];
// кадр ходьбы
const WALK = {
  33: '......uuu...qqQ...qqQ.....',
  34: '......uu...qqQ.....qqQ....',
  35: '.....u....qqQ.......qqQ...',
  36: '..........mmM........mmM..',
  37: '.........mmmM........mmmM.',
  38: '.........MMMM........MMMM.',
};

const HEAD_BOY = [
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '............rrrrrrr.......',
  '..........rrhhrrrrrrr.....',
  '.........rrhrrrrrrrrrr....',
  '........rrhrrrrrrrrrrrr...',
  '........rhrrrrrrrrrrrrr...',
  '.......rrrrrrrrrrrrrrrrr..',
  '.......rrrrrrrrrrrrrrrrr..',
  '......Rrrrrrrrrrrrrrrrrr..',
  '......Rrrrrrrrffrrfffrrr..',
  '......RRrrrFrffBBffBBBfr..',
  '......RRrrfFfffkkffkkkf...',
  '.......RrFfFfffwEffwEWff..',
  '.......RrrFFffffeffweeff..',
  '........rrrFfffffppfffF...',
  '.........rrFFffffffMmmf...',
  '.............Fffffffff....',
  '.............FFFfffff.....',
  '..............FFFFF.......',
];
const HEAD_GIRL = [
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '..........................',
  '............rrrrrrr.......',
  '..........rrhhrrrrrrr.....',
  '.........rrhrrrrrrrrrr....',
  '........rrhrrrrrrrrrrrr...',
  '........rhrrrrrrrrrrrrr...',
  '.......rrrrrrrrrrrrrrrrr..',
  '.......rrrrrrrrrrrrrrrrr..',
  '......Rrrrrrrrrrrrrrrrrr..',
  '......Rrrrrrrrhrrrrhrrrrr.',
  '......RRrrrFfrBBfffBBfrrr.',
  '......RRrrrFfkkkfffkkkkrr.',
  '.......RrrFffEWEfffEWEkr..',
  '.......RrrFffeeefffeeefr..',
  '.......RrrFfppffffFfppfr..',
  '.......RrrrFffffffmmffr...',
  '........rrr..Ffffffff.....',
  '........rr....FFffff......',
  '..............FFFFF.......',
];

// шлемы и шапки
const GEAR = {
  helmet: {
    1: '..................X.......',
    2: '.................XX.......',
    3: '...............XXu........',
    4: '..............XXUUu.......',
    5: '.............UUUUu........',
    6: '.............UUUu.........',
    7: '............SSSSSSS.......',
    8: '..........aSSSSSSSSST.....',
    9: '.........aaSSSSSSSSSTT....',
    10: '........SSSSSSSSSSSSTTT...',
    11: '........SSSSSSSSSSSSTTT...',
    12: '.......SSSSSSSSSSSSSTTTT..',
    13: '.......SSSSSSSSSSSSSTTTTT.',
    14: '........TTTTTTTTTTTTTTTTT.',
  },
  hood: {
    7: '............XUUUUUU.......',
    8: '..........XXXUUUUUUUU.....',
    9: '.........XXXXUUUUUUUUU....',
    10: '........uUUUUUUUUUUUUUU...',
    11: '........uUUUUUUUUUUUUUU...',
    12: '.......uuUUUUUUUUUUUUUUU..',
    13: '.......uuUUuUUUUUUUUUUUu..',
    14: '......uuuUUuUUUUUUUUUUUu..',
    15: '......uuuUUuUU..UU...UUu..',
    16: '......uuuUUuU..........U..',
    17: '......uuuUUu..............',
    18: '.......uuUUu..............',
    19: '.......uuUUu..............',
    20: '.......uuUUu..............',
    21: '.......uuUUu..............',
    22: '........uU.u..............',
    23: '........uU................',
  },
  mage: {
    0: '.......Xu.................',
    1: '........XUUu..............',
    2: '..........XUUu............',
    3: '...........XUUUu..........',
    4: '............XUUUu.........',
    5: '............XUUUUu........',
    6: '...........XUUyUUu........',
    7: '...........XUyyyUUu.......',
    8: '..........XUUUyUUUu.......',
    9: '..........XUUUUUUUUu......',
    10: '.........XUUUUUUUUUUu.....',
    11: '......UUUUUUUUUUUUUUUUUU..',
    12: '.....uuuuuuuuuuuuuuuuuuuu.',
  },
  ninja: {
    7: '............UUUUUUU.......',
    8: '..........UUUUUUUUUUU.....',
    9: '.........uUUUUUUUUUUUU....',
    10: '........uuUUUUUUUUUUUUU...',
    11: '........uuUUUUUUUUUUUUU...',
    12: '.......uuuUUUUUUUUUUUUUU..',
    13: '.......uuuUUUUUUUUUUUUUU..',
    14: '.....ZZZZZZZZZZZZZZZZZZZ..',
    15: '...ZZZuuuuUUUU..UU...UUU..',
    16: '..ZZ..uuuuU.U..........U..',
    17: '......uuuu................',
    18: '.......uu.................',
    19: '.......uuu................',
    20: '........uuU.uuUUUUUUUUUU..',
    21: '.........uU.uuUUUUUUUUUU..',
    22: '.............uUUUUUUUU....',
    23: '.............uUUUUUUU.....',
  },
  pirate: {
    7: '............bbbbbbb.......',
    8: '..........bbbbbbwbbbb.....',
    9: '.........bbbwbbbbbbbbb....',
    10: '........Bbbbbbbbbbbbwbb...',
    11: '........Bbbbbbbbbbbbbbb...',
    12: '.......BBbwbbbwbbbbbbbbb..',
    13: '.....B.BBbbbbbbbbbwbbbbb..',
    14: '....B.BBBBBBBBBBBBBBBBBB..',
    15: '....BB..........k.........',
    16: '...B.............kk...k...',
    17: '...................kkk....',
    18: '...................kkk....',
    19: '...................kkk....',
  },
  knight: {
    1: '..................X.......',
    2: '.................XX.......',
    3: '...............XXu........',
    4: '..............XXUUu.......',
    5: '.............UUUUu........',
    6: '.............UUUu.........',
    7: '............SSSSSSS.......',
    8: '..........aSSSSSSSSSS.....',
    9: '.........aaSSSSSSSSSSS....',
    10: '........aaaSSSSSSSSSSST...',
    11: '........aaaSSSSSSSSSSST...',
    12: '.......aaaaSSSSSSSSSSSTT..',
    13: '.......aaaaSSSSSSSSSSSTT..',
    14: '......SSSSSSSSSSSSSSSSTT..',
    15: '......SSTTTTTTTTTTTTTTTT..',
    16: '......SSSSSSSSSSSSSSSSTTT.',
    17: '......SSSSSSSSkkkkkkkkkkT.',
    18: '.......SSSSSSSSSSSSSSSTTT.',
    19: '.......SSSSSSSSSSSSSSSTT..',
    20: '........SSSSSSSSTSTSTST...',
    21: '.........SSSSSSSSSSSSST...',
    22: '.............TTTTTTTTT....',
    23: '.............TTTTTTTT.....',
  },
  horned: {
    1: '..i.......................',
    2: '..ii.................i....',
    3: '..iiI...............iI....',
    4: '...iiI.............iiI....',
    5: '....iiII..........iiI.....',
    6: '.....IiII...oOo..iII......',
    7: '......IIII.ooOooIIi.......',
    8: '........dhhDDDOODDDDd.....',
    9: '........hhhDDDDODDDDDd....',
    10: '........hhDDDDDDDDDDDDd...',
    11: '........hDDDDDDDDDDDDDd...',
    12: '.......dhDDDDDDDDDDDDDdd..',
    13: '.......dDyDDDyDDDyDDDyDdd.',
    14: '......yddddddddddddddddyd.',
    15: '......dD..................',
    16: '......dD..................',
    17: '......dD..................',
    18: '.......d..................',
  },
  winged: {
    1: '.w........................',
    2: 'wwW.......................',
    3: 'wwwW.w....................',
    4: '.wwWwwW...................',
    5: '.wwwWwwW....gLg...........',
    6: '..wwWwwwWW.gLLGg..........',
    7: '...wWWwwwWgLLLGGGg........',
    8: '.....WWwwWLLLGGGGGGGg.....',
    9: '......WWgLLLGGGGGGGGGg....',
    10: '.......gLLGGGGGGGGGGGGgg..',
    11: '......gLLGGGGGGGGGGGGGgg..',
    12: '......gLGGGGGGGGGGGrrGGgg.',
    13: '......gGGGGGGGGGGGGGrGGgg.',
    14: '......yyyyyyyyyyyyyyyyyyy.',
    15: '......gGg.................',
    16: '......gGg.................',
    17: '.......gg.................',
  },
  frost: {
    0: '............w.............',
    1: '...........wc....w........',
    2: '........w..wcC..wc........',
    3: '........wc.wcC..wcC.w.....',
    4: '.......wcCwwcCC.wcCwc.....',
    5: '.......wcCwwcccCcwccCwcC..',
    6: '........cCwccccccccccCcC..',
    7: '........wccccccccccccccC..',
    8: '........wcccwcccccccccccd.',
    9: '........wccwccccccccccccCd',
    10: '........cwcccccccccccccccd',
    11: '.......wcwcccccccgcccccccd',
    12: '.......cccccccccgGgcccccCd',
    13: '.......CcccccccccgcccccccC',
    14: '......dCCCCCCCCCCCCCCCCCCd',
    15: '......dCd.................',
    16: '......dCd.................',
    17: '.......C..................',
    18: '.......w..................',
  },
  crown: {
    5: '..........y..y..y..y......',
    6: '..........y..y..y..y......',
    7: '..........yyyyyyyyyy......',
    8: '..........yygyyvyygy......',
  },
};
const GEAR_PAL = { S: '#C9CED8', T: '#8E95A6', a: '#F4F6FA', Z: '#E0605A', b: '#C9473F', B: '#8E2C27', w: '#FFFFFF',
  k: '#2A1B14', y: '#F2C14E', Y: '#C7922A', g: '#6FD6FF', v: '#E0605A' };

// хвостик у героини
const PONYTAIL = {
  12: '.....vv',
  13: '....vvRR',
  14: '....rrvv',
  15: '...hrrR',
  16: '...rrrR',
  17: '..hrrrR',
  18: '..rrrrR',
  19: '..hrrR',
  20: '..rrrR',
  21: '..hrrR',
  22: '...rrR',
  23: '...hR',
  24: '....R',
};
// у героини юбка
const GIRL_HEM = {
  32: '......uuuuXUUUUUUUUUUUu...',
  33: '......uuu.uXUUUUUUUUUUu...',
  34: '......uu..XXXXXXXXXXXXX...',
};

// цвета новых шлемов
const GEAR_OWN_PAL = {
  horned: { i: '#F1E6C8', I: '#B9A37A', o: '#FF9A3C', O: '#E0472E', D: '#A8322C', d: '#5E1A18', h: '#D9584B', y: '#F2C14E' },
  winged: { w: '#FFFFFF', W: '#98A5C0', G: '#E8B828', g: '#9E7212', L: '#FFF0A0', y: '#C7922A', r: '#D83A4A' },
  frost: { w: '#FFFFFF', c: '#BDEBFA', C: '#7CC6E6', d: '#3C7FAE', g: '#5FE3FF', G: '#2AA8D8' },
};

// доспехи
const ARMOR = {
  red: {
    pal: { k: '#2A1620', y: '#F2C14E', D: '#6E1E1E', d: '#3E0F12', h: '#B8433A', o: '#FFB347', O: '#E85A2A' },
    rows: {
      25: '...........kk....kDhhd....',
      26: '............k....DhhDDd...',
      27: '.............k..yDDDDDd...',
      28: '..............k....dd.....',
      29: '.............kkkyykk......',
      31: '............k.......k.....',
      32: '......oO...O..............',
      33: '......oOo.................',
      34: '.....oOo..................',
      35: '....oO....................',
    },
  },
  gold: {
    pal: { G: '#E8B828', g: '#9E7212', L: '#FFF0A0', y: '#F7D35A', r: '#D83A4A', c: '#2E4FA8', C: '#1F3577' },
    rows: {
      25: '...........gLGGGGLg.......',
      26: '...........gLLGGGGLLGgg...',
      27: '...........gLGGGGGGLGGg...',
      28: '............gLGGGGg.LGGg..',
      29: '.............gyyryyg......',
      30: '............gGLGgGLGg.....',
      31: '...........gGLGgGLGGg.....',
      32: '............gg....gg......',
      33: '.....cCC..................',
      34: '.....cCC..................',
      35: '....cCCC..................',
      36: '....yyyy..................',
    },
  },
  ice: {
    pal: { w: '#FFFFFF', c: '#BDEBFA', C: '#7CC6E6', d: '#3C7FAE', g: '#5FE3FF', G: '#2AA8D8' },
    rows: {
      22: '.....................w....',
      23: '....................wc....',
      24: '..........w.........wcC...',
      25: '.........wc........wcCd...',
      26: '..........cC.c.....cCCd...',
      27: '.............cgcCg..cCd...',
      28: '..............cGc.........',
      29: '.............dddgddd......',
      31: '............w..w..w.......',
      32: '.......w..w...............',
      33: '......cw.w................',
      34: '......w.w.................',
      35: '.....w....................',
      36: '.....c.c..................',
    },
  },
};

export const SKINS = {
  blue:   { gear: 'helmet', pal: { U: '#4F7CC9', u: '#355A97', X: '#86ACEB' } },
  green:  { gear: 'hood',   pal: { U: '#4E8F47', u: '#33632F', X: '#86C97A' } },
  red:    { gear: 'horned', pal: { U: '#B8332C', u: '#7A1E1E', X: '#E8685C' } },
  ninja:  { gear: 'ninja',  pal: { U: '#3A3550', u: '#24203A', X: '#5D5680' } },
  violet: { gear: 'mage',   pal: { U: '#7A4FC9', u: '#55348F', X: '#A98BEA' } },
  pirate: { gear: 'pirate', pal: { U: '#2F3E6E', u: '#1E2849', X: '#5468A8' } },
  knight: { gear: 'knight', pal: { U: '#A9B0C2', u: '#6E7690', X: '#E2E6EF' } },
  gold:   { gear: 'winged', pal: { U: '#3557B5', u: '#1F3577', X: '#6F92E0' } },
  ice:    { gear: 'frost',  pal: { U: '#3F78B0', u: '#25507E', X: '#8CC4EE' } },
  crown:  { gear: 'crown',  pal: { U: '#9E2A44', u: '#6B1A2E', X: '#F4F1EA' } },
};
const GIRL_HAIR = { r: '#8A4B2A', R: '#5E3019', h: '#B06A3C', v: '#F27BA6' };

// оружие, у каждого 3 версии. hand - строка где рука
export const WEAPONS = {
  sword: [
    { hand: 13, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22' }, rows: [
      '...a...', '..gaG..', '..gaG..', '..gaG..', '..gaG..', '..gaG..', '..gaG..', '..gaG..', '..gaG..',
      '..gaG..', '..gGG..', '.YyyyY.', '...h...', '...h...', '...H...', '..yYy..',
    ] },
    { hand: 17, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', b: '#4F7CC9' }, rows: [
      '...a...', '..aag..', '..gaG..', '..gbG..', '..gbG..', '..gbG..', '..gbG..', '..gbG..', '..gbG..',
      '..gbG..', '..gbG..', '..gbG..', '..gaG..', '..gGG..', 'YyyyyyY', 'Y..H..Y', '...h...', '...H...',
      '...h...', '..YyY..', '...Y...',
    ] },
    { hand: 21, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', B: '#3E6FE0' }, rows: [
      '...c...', '..cac..', '...a...', '..aag..', '.yagGy.', '.yacGy.', '.yagGy.', '.yagGy.', '.yacGy.',
      '.yagGy.', '.yagGy.', '.yacGy.', '.yagGy.', '.yagGy.', '.yagGy.', '..yGy..', 'YyyByyY', '.Y.H.Y.',
      '...h...', '...H...', '...h...', '...H...', '..yBy..', '...y...',
    ] },
  ],
  ruler: [
    { hand: 13, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', k: '#8A5A33', T: '#8E95A6' }, rows: [
      '..yyY..', '..kyY..', '..yyY..', '..kkY..', '..yyY..', '..kyY..', '..yyY..', '..kkY..', '..yyY..',
      '..kyY..', '..yyY..', '.TTTTT.', '...h...', '...h...', '...H...', '...T...',
    ] },
    { hand: 17, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', b: '#4F7CC9' }, rows: [
      '...a...', '..aag..', '..bgG..', '..agG..', '..bbG..', '..agG..', '..bgG..', '..agG..', '..bbG..',
      '..agG..', '..bgG..', '..agG..', '..bbG..', '..agG..', 'YyyyyyY', '.YyLyY.', '..YhY..', '...h...',
      '...H...', '..bYb..',
    ] },
    { hand: 21, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', B: '#3E6FE0', k: '#B8861E' }, rows: [
      '..c....', '..y....', '..yG...', '..yaG..', '..kaG..', '..yaG..', '..yagG.', '..kcgG.', '..yagG.',
      '..yagG.', '..kaggG', '..ycggG', '..yaggG', '..kaggG', '..yyyyy', '.YyBy..', '..yLy..', '...y...',
      '...h...', '...H...', '...h...', '...H...', '..yBy..',
    ] },
  ],
  quill: [
    { hand: 9, pal: { w: '#FFFFFF', L: '#B9C2D6', k: '#1A1426', S: '#C9CED8', s: '#8E95A6', a: '#F4F6FA' }, rows: [
      '...k...', '..kSk..', '..SaS..', '...s...', '..wsL..', '.wwsLL.', '.wwsLL.', '.wwsLL.', '..wsL..',
      '..wsL..', '...s...', '...s...',
    ] },
    { hand: 16, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', w: '#FFFFFF', L: '#B9C2D6', k: '#1A1426', b: '#3E5FA8', B: '#6F8FE0', s: '#8E95A6' }, rows: [
      '...k...', '...k...', '...aG..', '...aG..', '...aG..', '...aG..', '...aG..', '...aG..', '...aG..',
      '...aG..', '...aG..', '..bBb..', '.ggggg.', '.g.s.g.', '...s...', '...s...', '...s...', '..wwL..',
      '.wwwL..', '..wL...',
    ] },
    { hand: 19, pal: { y: '#F2C14E', Y: '#B8861E', L: '#B9C2D6', w: '#FFFFFF', W: '#D9E2F2', k: '#3A2416', o: '#2A1B14', v: '#9B6BFF', V: '#6A3FC9', s: '#C7922A' }, rows: [
      '...k...', '...y...', '..yLY..', '..yLY..', '.yLkYY.', '.yLkYY.', '.yLkYY.', '.yLoYY.', '.yyyYY.',
      '..yYY..', '..vvv..', '..vVv..', '...s...', '...s...', '..wws..', '.wwwsW.', '.wwwsW.', 'wwwwsWW',
      '.wwwsW.', '..wws..', '...wsW.', '...ws..',
    ] },
  ],
  book: [
    { hand: 6, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', c: '#8FE8FF', C: '#2AA8D8', V: '#7A4FC9', v: '#55348F', w: '#F4EBD3' }, rows: [
      '...c...', '..c.c..', 'VVVVVv.', 'VyVVVw.', 'VVcVVw.', 'VVVVVw.', 'VyVVVw.', 'vvvvvv.',
    ] },
    { hand: 8, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', c: '#8FE8FF', C: '#2AA8D8', R: '#B8332C', r: '#7A1E1E', w: '#F4EBD3', v: '#E0605A' }, rows: [
      '....c..', '...c.c.', 'RRRRRRr', 'RyyyyRw', 'RyRRyRw', 'RyLLyRw', 'RyRRyRw', 'RyyyyRw', 'rrrrrrw',
      '.v.....', '.v.....',
    ] },
    { hand: 11, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', c: '#8FE8FF', C: '#2AA8D8', V: '#4A2E8A', B: '#3E6FE0', w: '#FFFFFF', W: '#D6E4FF', k: '#6A7FB8' }, rows: [
      'c.....c', '...c...', '.......', 'wwwWwww', 'wkkWkkw', 'wwwWwww', 'wkkWkkw', 'wwwWwww', 'VVVVVVV',
      'VyyByyV', '.VVVVV.', '..y.y..', '..c.c..',
    ] },
  ],
  scroll: [
    { hand: 6, pal: { h: '#8A5A33', H: '#5E3B22', w: '#F4EBD3', k: '#8A6A4A', v: '#E0605A' }, rows: [
      '.hhhhh.', '..www..', '..wkw..', '..www..', '..wkw..', '..www..', '.hhhhh.', '...v...',
    ] },
    { hand: 9, pal: { h: '#8A5A33', H: '#5E3B22', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', w: '#F4EBD3', k: '#5E3B22', v: '#C9473F', V: '#8E2C27' }, rows: [
      'YhhhhhY', '.wwwww.', '.wkkkw.', '.wwwww.', '.wkkww.', '.wwwww.', '.wkkkw.', '.wwvVw.', 'YhhhhhY',
      '..vV...',
    ] },
    { hand: 12, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', c: '#8FE8FF', C: '#2AA8D8', w: '#FFF8E6', k: '#3E6FE0', K: '#2E9E5E', R: '#C9473F', v: '#9B6BFF' }, rows: [
      'c.....c', '.......', 'YyyyyyY', '.wwwww.', '.wkkkw.', '.wwwww.', '.wKKww.', '.wwwww.', '.wkKkw.',
      '.wwwww.', '.wRwvw.', 'YyyyyyY', '..R.v..', '..R.v..',
    ] },
  ],
  hammer: [
    { hand: 12, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', h: '#8A5A33', H: '#5E3B22' }, rows: [
      '.aggGK.', '.ggggK.', '.GGGGK.', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...H...',
    ] },
    { hand: 14, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', o: '#E08A3C', O: '#A85A22' }, rows: [
      'c.....c', 'agoOoGK', 'ggoOoGK', 'GGoOoGK', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...H...', '..GKG..',
    ] },
    { hand: 17, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8' }, rows: [
      'c.....c', '...y...', 'aggcggK', 'ggcccgK', 'gggcggK', 'GGGGGGK', '..ycy..', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...H...', '..yYy..',
    ] },
  ],
  flask: [
    { hand: 8, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', h: '#8A5A33', H: '#5E3B22', c: '#B4F5D0', C: '#4FC48A', n: '#8A5A33' }, rows: [
      '...c...', '..c....', '...n...', '..ggg..', '...g...', '..gCg..', '.gCCCg.', '.gCcCg.', '..ggg..',
    ] },
    { hand: 9, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', c: '#E0C4FF', C: '#9B6BFF', D: '#6A3FC9', n: '#8A5A33' }, rows: [
      '..c.c..', '...c...', '...n...', '..gng..', '...g...', '..gCg..', '.gCcCg.', 'gCCCCDg', 'gCcCCDg',
      'gDCCDDg', '.ggggg.',
    ] },
    { hand: 11, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', c: '#8FE8FF', C: '#2AA8D8', R: '#E0405A', r: '#FF8AA0', P: '#FFD9E0' }, rows: [
      'c.....c', '...y...', '...y...', '..yyy..', '...a...', '..aPa..', '.aPrPa.', 'aPrRrPa', 'aPRRRPa',
      'aPrRrPa', '.aPPPa.', 'YyyyyyY',
    ] },
  ],
  staff: [
    { hand: 14, pal: { h: '#8A5A33', H: '#5E3B22', L: '#7BC96F', D: '#4E8F47' }, rows: [
      '..L.L..', '.LDLD..', '..LDL..', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...H...', '...h...',
    ] },
    { hand: 17, pal: { h: '#8A5A33', H: '#5E3B22', L: '#7BC96F', D: '#4E8F47', p: '#F59AB0', P: '#D9608A', y: '#F2C14E' }, rows: [
      '..p.p..', '.pPyPp.', '..pPp..', '.L.h.L.', 'LD.h.DL', '...h...', '...hL..', '...hD..', '...h...',
      '..Lh...', '..Dh...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...H...',
      '...h...',
    ] },
    { hand: 20, pal: { h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', L: '#7BC96F', D: '#4E8F47', M: '#2F6E3A', y: '#FFD34E', Y: '#FFF0A0' }, rows: [
      '..LLL..', '.LLDLL.', 'LLyLDLL', 'LDLLLyL', '.LLDLL.', '..MhM..', '...h...', '..hhh..', '.h.h.h.',
      '...h...', '..Lh...', '..Dh...', '...hL..', '...hD..', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '..hHh..', '.h...h.',
    ] },
  ],
  spear: [
    { hand: 15, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', h: '#8A5A33', H: '#5E3B22', v: '#C9473F' }, rows: [
      '...a...', '..agG..', '..agG..', '...g...', '..vvv..', '..v.v..', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...H...',
    ] },
    { hand: 18, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', v: '#C9473F', V: '#8E2C27' }, rows: [
      '...a...', '..aag..', '.aagGK.', '.agggK.', '..agG..', '...g...', '..yyy..', '.vvvvv.', '.vVvVv.',
      '..v.v..', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...H...',
    ] },
    { hand: 21, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', R: '#C9473F', r: '#8E2C27' }, rows: [
      '...c...', '...L...', '..yLY..', '.yyLYY.', 'y.yLY.Y', '...y...', '..yYy..', '...hRRR', '...hRyR',
      '...hRRR', '...hRr.', '...hr..', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...H...', '..yYy..',
    ] },
  ],
  axe: [
    { hand: 12, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', h: '#8A5A33', H: '#5E3B22' }, rows: [
      '...ha..', '...hagg', '...hggG', '...hgGG', '...hG..', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...H...',
    ] },
    { hand: 15, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', b: '#4F7CC9' }, rows: [
      '...y...', '...haa.', '...hagg', '...hgbg', '...hggG', '...hgG.', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...H...',
    ] },
    { hand: 18, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', M: '#5FE39A' }, rows: [
      '...c...', '...y...', '.aayaa.', 'aggyggG', 'agMcMgG', 'aggyggG', '.agyGG.', '...y...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...H...', '..yYy..',
    ] },
  ],
  pixel: [
    { hand: 13, pal: { c: '#6FD6FF', C: '#4FC4A6', k: '#2A2346' }, rows: [
      '...c...', '..cC...', '..Cc...', '..cC...', '..Cc...', '..cC...', '..Cc...', '..cC...', '..Cc...',
      '..cC...', '..Cc...', '.kkkkk.', '...k...', '...k...', '...k...', '..kkk..',
    ] },
    { hand: 17, pal: { c: '#7DFFB0', C: '#2FC46A', D: '#1E7A44', k: '#2A2346', w: '#FFFFFF' }, rows: [
      '...w...', '..wc...', '..cCD..', '..CcD..', '..cwD..', '..CcD..', '..cCD..', '..wcD..', '..cCD..',
      '..CcD..', '..cwD..', '..CcD..', '..cCD..', '..CDD..', 'kkkkkkk', 'k..k..k', '...k...', '...k...',
      '..kCk..', '..kkk..',
    ] },
    { hand: 21, pal: { c: '#8FE8FF', C: '#2AA8D8', m: '#FF6FD8', M: '#B83FA0', k: '#2A2346', w: '#FFFFFF' }, rows: [
      'm..w..m', '...c...', '..ccC..', '.mccCm.', '.mcwCm.', '.mccCm.', '.MccCM.', '.mcwCm.', '.mccCm.',
      '.MccCM.', '.mcwCm.', '.mccCm.', '.MccCM.', '.mccCm.', '..MCM..', 'kmmmmmk', 'kMkkkMk', '...k...',
      '...m...', '...k...', '...m...', '..kMk..',
    ] },
  ],
  brush: [
    { hand: 12, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', v: '#E0605A', V: '#A3352F', T: '#8E95A6' }, rows: [
      '...v...', '..vV...', '..vV...', '...T...', '...T...', '...y...', '...y...', '...y...', '...y...',
      '...y...', '...y...', '...y...', '...y...', '...Y...',
    ] },
    { hand: 15, pal: { y: '#F2E14E', Y: '#B8861E', L: '#FFF0A0', r: '#E0605A', o: '#F2A541', g: '#6FCF5A', b: '#4F9FE0', v: '#9B6BFF', T: '#C9CED8', h: '#B06A3C' }, rows: [
      '...r...', '..ro...', '..oy...', '..yg...', '..gb...', '..bv...', '..TT...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '..ThT..',
    ] },
    { hand: 19, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', c: '#8FE8FF', C: '#2AA8D8', r: '#E0605A', o: '#F2A541', g: '#6FCF5A', b: '#4F9FE0', v: '#9B6BFF', w: '#FFFFFF', W: '#E8D9B8' }, rows: [
      'c.....c', '...w...', '..rwo..', '..rwo..', '.rrwoo.', '.rbwgo.', '..bvg..', '..yLY..', '..yLY..',
      'WWWyWW.', 'WrWyWb.', 'WWgyvW.', '.WWyW..', '...y...', '...y...', '...y...', '...y...', '...y...',
      '...y...', '...y...', '...y...', '..yLy..',
    ] },
  ],
  club: [
    { hand: 12, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#5A6070', h: '#8A5A33', H: '#5E3B22' }, rows: [
      '..G.G..', '..ggg..', '.GgaGG.', '..ggg..', '..G.G..', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...H...',
    ] },
    { hand: 15, pal: { a: '#F4F6FA', g: '#C9CED8', G: '#8E95A6', K: '#24203A', h: '#8A5A33', H: '#5E3B22', k: '#3A3550' }, rows: [
      '..kkk..', '.k...k.', '.kkkkk.', 'kkaKkkK', 'kkkkkkK', '.KKKKK.', '...g...', '...h...', '...h...',
      '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...h...', '...H...',
    ] },
    { hand: 17, pal: { y: '#F2C14E', Y: '#B8861E', L: '#FFF0A0', h: '#8A5A33', H: '#5E3B22', c: '#8FE8FF', C: '#2AA8D8', r: '#C9473F', b: '#3E6FE0' }, rows: [
      '...c...', '..yLy..', 'y.yyy.y', '.yyLyy.', 'yyLyYYy', '.yyyYy.', 'y.yYy.y', '..yYy..', '...y...',
      '...hrb.', '...hbr.', '...hyy.', '...hYY.', '...h...', '...h...', '...h...', '...h...', '...h...',
      '...h...', '...H...', '..yYy..',
    ] },
  ],
};

function toRows(map, base) {
  const rows = base.slice();
  for (const [i, row] of Object.entries(map)) rows[Number(i)] = row.padEnd(W, '.');
  return rows;
}

function blank(n) {
  return Array.from({ length: n }, () => '.'.repeat(W));
}

// склеиваем слои в один рисунок (буквы меняем, чтобы цвета не перепутались)
function compose(layers, height, width = W) {
  const grid = Array.from({ length: height }, () => Array(width).fill('.'));
  const pal = {};
  layers.forEach((layer, li) => {
    const ox = layer.x || 0;
    const oy = layer.y || 0;
    layer.rows.forEach((row, ry) => {
      if (!row) return;
      [...row].forEach((ch, rx) => {
        const color = layer.pal[ch];
        if (ch === '.' || color === undefined) return;
        const x = ox + rx;
        const y = oy + ry;
        if (y < 0 || y >= height || x < 0 || x >= width) return;
        const key = String.fromCharCode(0x100 + li * 64 + (ch.charCodeAt(0) % 64));
        pal[key] = color;
        grid[y][x] = key;
      });
    });
  });
  return { rows: grid.map((r) => r.join('')), pal };
}

function headLayers(skin, gender) {
  const s = SKINS[skin] || SKINS.blue;
  const girl = gender === 'f';
  const layers = [];
  if (girl) layers.push({ rows: toRows(PONYTAIL, blank(HEAD_ROWS)), pal: { ...FACE_PAL, ...GIRL_HAIR } });
  layers.push({ rows: girl ? HEAD_GIRL : HEAD_BOY, pal: girl ? { ...FACE_PAL, ...GIRL_FACE } : FACE_PAL });
  layers.push({ rows: toRows(GEAR[s.gear], blank(HEAD_ROWS)), pal: { ...GEAR_PAL, ...s.pal, ...GEAR_OWN_PAL[s.gear] } });
  return layers;
}

// где рука
const HAND_ROW = 29;
const HERO_W = 29;

function weaponArt(id, tier) {
  const tiers = WEAPONS[id] || WEAPONS.sword;
  return tiers[Math.min(Math.max(tier, 1), 3) - 1];
}

function heroLayers(skin, gender, weapon, tier, walk) {
  const s = SKINS[skin] || SKINS.blue;
  const girl = gender === 'f';
  let body = walk ? toRows(WALK, BODY) : BODY.slice();
  if (girl) body = toRows(GIRL_HEM, body);
  const w = weaponArt(weapon, tier);
  return [
    { rows: body, pal: { ...BODY_PAL, ...s.pal } },
    ...(ARMOR[skin] ? [{ rows: toRows(ARMOR[skin].rows, blank(BODY.length)), pal: ARMOR[skin].pal }] : []),
    ...headLayers(skin, gender),
    { rows: w.rows, pal: w.pal, x: 22, y: HAND_ROW - w.hand },
  ];
}

// герой сидит у костра
const SIT_DROP = 4;
const SIT_LEGS = {
  34: '....................qqqQ..',
  35: '..................qqqqqQ..',
  36: '................qqqq.qqQ..',
  37: '.....................mmmM.',
  38: '.....................MMMM.',
};

function sitLayers(skin, gender) {
  const s = SKINS[skin] || SKINS.blue;
  const girl = gender === 'f';
  const keep = girl ? 35 : 33;
  const cut = (rows) => rows.map((r, i) => (i < keep ? r : '.'.repeat(W)));
  const body = cut(girl ? toRows(GIRL_HEM, BODY) : BODY.slice());
  return [
    { rows: body, pal: { ...BODY_PAL, ...s.pal }, y: SIT_DROP },
    ...(ARMOR[skin] ? [{ rows: cut(toRows(ARMOR[skin].rows, blank(BODY.length))), pal: ARMOR[skin].pal, y: SIT_DROP }] : []),
    { rows: toRows(SIT_LEGS, blank(BODY.length)), pal: BODY_PAL },
    ...headLayers(skin, gender).map((l) => ({ ...l, y: SIT_DROP })),
  ];
}

export function heroSitSprite(hero, cls = '', scale = null) {
  const { skin = 'blue', gender = 'm' } = hero || {};
  const name = `hero-sit-${skin}-${gender}`;
  const art = compose(sitLayers(skin, gender), BODY.length, HERO_W);
  registerSprite(name, { rows: art.rows, pal: art.pal });
  const k = scale ?? cls.split(' ').map((c) => HERO_SCALE[c]).find(Boolean) ?? 2;
  return sprite(name, cls, {}, k);
}

function ensureHero(skin, gender, weapon, tier) {
  const name = `hero-${skin}-${gender}-${weapon}-${tier}`;
  const still = compose(heroLayers(skin, gender, weapon, tier, false), BODY.length, HERO_W);
  const step = compose(heroLayers(skin, gender, weapon, tier, true), BODY.length, HERO_W);
  const frame = {};
  step.rows.forEach((row, i) => { if (row !== still.rows[i]) frame[i] = row; });
  registerSprite(name, { rows: still.rows, pal: { ...still.pal, ...step.pal }, frames: [frame] });
  return name;
}

const HERO_SCALE = { trail: 2, gear: 2, mid: 2, sheet: 4 };

export function heroSprite(hero, cls = '', scale = null) {
  const { skin = 'blue', gender = 'm', weapon = 'sword', weapon_tier: tier = 1 } = hero || {};
  const name = ensureHero(skin, gender, weapon, tier);
  const k = scale ?? cls.split(' ').map((c) => HERO_SCALE[c]).find(Boolean) ?? 2;
  return sprite(name, cls, {}, k);
}

// голова для аватарки
export function heroPortrait(hero, scale = 2) {
  const { skin = 'blue', gender = 'm' } = hero || {};
  const name = `portrait-${skin}-${gender}`;
  const art = compose(headLayers(skin, gender), HEAD_ROWS);
  // убираем пустые края чтобы голова была по центру
  const used = art.rows.filter((r) => /[^.]/.test(r));
  const left = Math.min(...used.map((r) => r.search(/[^.]/)));
  const right = Math.max(...used.map((r) => r.length - [...r].reverse().join('').search(/[^.]/)));
  registerSprite(name, { rows: used.map((r) => r.slice(left, right)), pal: art.pal });
  return sprite(name, 'portrait', {}, scale);
}

export function weaponIcon(id, tier = 1, scale = 3) {
  const w = weaponArt(id, tier);
  const name = `weapon-${id}-${tier}`;
  registerSprite(name, { rows: w.rows.map((r) => r.padEnd(7, '.')), pal: w.pal });
  return sprite(name, '', {}, scale);
}

export const ALL_SKINS = Object.keys(SKINS);
