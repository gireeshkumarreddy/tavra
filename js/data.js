// TĀVRA content: products, sports, the lineup and origins.
// Product names, prices and colours come from the TĀVRA catalogue. All are concept pieces.

const P = 'assets/photos/';
const T = 'assets/textiles/';

// Crops for the bag's thumbnails: each product photo is a full look, zoomed onto the piece being sold.
const CROP = {
  'Sports bras': { zoom: 2,    focus: '50% 22%' },
  Leggings:      { zoom: 1.3,  focus: '50% 74%' },
  Shorts:        { zoom: 1.75, focus: '50% 46%' },
  Tops:          { zoom: 1.6,  focus: '50% 26%' },
  Jackets:       { zoom: 1.55, focus: '50% 26%' },
  Vests:         { zoom: 1.6,  focus: '50% 26%' },
};

// The store: one product per category, each with its own photograph.
export const PRODUCTS = [
  { id: 'vermilion-bra',   name: 'Vermilion Racer Bra',    collection: 'Vermilion', type: 'Sports bras', price: 58,  color: 'Vermilion',         photo: 'vermilion-woman', bg: '#ecdccb' },
  { id: 'lotus-legging',   name: 'Lotus Sculpt Legging',   collection: 'Lotus',     type: 'Leggings',    price: 88,  color: 'Forest / Lotus',    photo: 'lotus-woman',     bg: '#dce0d3' },
  { id: 'ivory-short',     name: 'Ivory Botanical Short',  collection: 'Ivory',     type: 'Shorts',      price: 68,  color: 'Ivory / Gold',      photo: 'ivory-woman-v2',  bg: '#ede2c9' },
  { id: 'bengal-w-jacket', name: 'Bengal Studio Jacket',   collection: 'Bengal',    type: 'Jackets',     price: 145, color: 'Navy / Ivory',      photo: 'bengal-woman-v2', bg: '#dce6ed' },
  { id: 'paisley-top',     name: 'Paisley Motion Zip Top', collection: 'Vermilion', type: 'Tops',        price: 98,  color: 'Burgundy / Indigo', photo: 'paisley-woman',   bg: '#e7dad6' },
  { id: 'noir-vest',       name: 'Noir Sculpt Vest',       collection: 'Noir',      type: 'Vests',       price: 135, color: 'Black / Charcoal',  photo: 'noir-woman-v2',   bg: '#e5dfeb' },
].map(p => ({ ...p, img: `${P}${p.photo}.webp`, ...CROP[p.type] }));

export const BY_ID = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
export const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

// Four sports, one wardrobe: each takes one collection's print and colours.
export const SPORTS = [
  { name: 'Tennis', print: 'Zari gold', shot: 'sport-tennis', shotPos: '62% 50%',
    shotAlt: 'Woman sitting on a blue court in a white pleated tennis dress with an embroidered Indian border, tennis balls around her',
    line: 'Ivory court whites with zari-gold piping, cut to move side to side.' },
  { name: 'Basketball', print: 'Ajrakh', shot: 'sport-basketball', shotPos: '50% 50%',
    shotAlt: 'Woman dribbling a basketball on an orange track in a blue sports bra and shorts with tricolour piping and a gold lotus',
    line: 'Indigo with ajrakh side panels, long and loose for the paint.' },
  { name: 'Badminton', print: 'Paisley', shot: 'sport-badminton', shotPos: '50% 50%', blend: true,
    shotAlt: 'Woman stretching in a vermilion sports bra and bike shorts with gold paisley, lotus and tricolour piping, a white court shoe stepping out of the frame',
    line: 'Vermilion with gold paisley and tricolour piping, fitted for fast footwork.' },
  { name: 'Running', print: 'Tricolour', shot: 'sport-running', shotPos: '50% 50%',
    shotAlt: 'Woman running across concrete in a cobalt sports bra and leggings with tricolour side stripes, a yellow line painted behind her',
    line: 'Cobalt with tricolour piping, for the long road and the last lap.' },
];

// The lineup: every look, the studio sets (cut-outs on their colour) and the campaign shots.
export const LINEUP = [
  { name: 'Lotus Sculpt set',     tag: 'Lotus',      img: 'lotus-woman',      cut: true, bg: '#dce0d3' },
  { name: 'Court Whites',         tag: 'Court',      img: 'court-whites',     pos: '50% 40%' },
  { name: 'Vermilion Racer set',  tag: 'Vermilion',  img: 'vermilion-woman',  cut: true, bg: '#ecdccb' },
  { name: 'Ivory Ace Dress',      tag: 'Tennis',     img: 'sport-tennis',     pos: '64% 50%' },
  { name: 'Bengal Studio set',    tag: 'Bengal',     img: 'bengal-woman-v2',  cut: true, bg: '#dce6ed' },
  { name: 'Mudra Zip Jacket',     tag: 'Origins',    img: 'og-mudra-back',    pos: '50% 30%' },
  { name: 'Ivory Botanical set',  tag: 'Ivory',      img: 'ivory-woman-v2',   cut: true, bg: '#ede2c9' },
  { name: 'Court Blue set',       tag: 'Basketball', img: 'sport-basketball', pos: '50% 40%' },
  { name: 'Paisley Motion set',   tag: 'Paisley',    img: 'paisley-woman',    cut: true, bg: '#e7dad6' },
  { name: 'Block-print Zip Top',  tag: 'Origins',    img: 'og-blockprint',    pos: '50% 30%' },
  { name: 'Noir Sculpt set',      tag: 'Noir',       img: 'noir-woman-v2',    cut: true, bg: '#e5dfeb' },
  { name: 'Vermilion Bike set',   tag: 'Badminton',  img: 'sport-badminton',  pos: '50% 22%' },
  { name: 'Bengal Tiger kit',     tag: 'Origins',    img: 'og-tiger-kit',     pos: '50% 50%' },
  { name: 'Cobalt Stripe set',    tag: 'Running',    img: 'sport-running',    pos: '50% 50%' },
  { name: 'Brocade Court set',    tag: 'Origins',    img: 'og-brocade',       pos: '50% 20%' },
];

// Origins: four Indian artworks and the pieces drawn from them, cut from the reference images by
// tools/cut-origins.py. `pair` links an artwork to its piece; `at` is [left, top, width, tilt°, depth], with left and
// width in hundredths of a 16:9 frame's width and top in hundredths of its height.
export const ORIGIN_PAIRS = [
  { art: 'Pichwai painting', piece: 'Mudra Zip Jacket', line: 'mudras and a lotus, traced in gold down the back of a burgundy zip jacket.' },
  { art: 'Hand-block print', piece: 'Block-print Zip Top', line: 'madder red and indigo flowers, printed by hand onto a fitted zip top.' },
  { art: 'Miniature painting', piece: 'Bengal Tiger kit', line: 'a painted tiger walks down both sleeves of a navy track jacket.' },
  { art: 'Banarasi brocade', piece: 'Brocade Court set', line: 'a zari lotus border, rewoven into a flared court skort.' },
];
export const ORIGIN_PIECES = [
  { pair: 2, art: true, img: 'og-art-tiger',      w: 323, h: 218,  at: [42, 8, 14, -2, 0.6],     alt: 'A miniature painting of a tiger' },
  { pair: 2,            img: 'og-tiger-kit',      w: 894, h: 1112, at: [70.5, 14, 11.5, 3, 1.1], alt: 'Navy cap, tiger-sleeve track jacket, beige crop and navy joggers laid flat' },
  { pair: 0, art: true, img: 'og-art-pichwai',    w: 233, h: 344,  at: [16, 22, 9, -4, 0.8],     alt: 'A Pichwai painting of a hand in mudra holding a lotus' },
  { pair: 1,            img: 'og-blockprint',     w: 608, h: 652,  at: [3.5, 47, 12.5, 2, 1.2],  alt: 'Model in a red block-printed zip top with indigo panels and a navy cap' },
  { pair: 0,            img: 'og-mudra-back',     w: 459, h: 873,  at: [17.5, 58, 9.5, -3, 1],   alt: 'The back of a burgundy zip jacket drawn with mudra hands and a lotus' },
  { pair: 3, art: true, img: 'og-art-banarasi',   w: 294, h: 426,  at: [39, 75, 7.5, 4, 0.7],    alt: 'Orange Banarasi silk with a zari lotus border' },
  { pair: 1, art: true, img: 'og-art-blockprint', w: 286, h: 436,  at: [66, 67, 8, -2, 0.9],     alt: 'Red block-printed fabric with blue flowers' },
  { pair: 3,            img: 'og-brocade',        w: 588, h: 676,  at: [82, 43, 12, -3, 1.15],   alt: 'Model in a red racer bra with a gold edge and a brocade skort' },
];

// absolute URLs: a url() inside a CSS variable resolves against the stylesheet that uses it,
// so relative paths set from script would point into css/
const abs = p => new URL(p, document.baseURI).href;
export const photo = name => abs(`${P}${name}.webp`);
export const tile = name => abs(`${T}${name}.svg`);
