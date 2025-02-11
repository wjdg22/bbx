import bricklinkColors from '../../data/bricklink-hex.json';
import { mergeTags } from './clean-utils.js';

export const partNrDivider = 'Nr.: ';

export const includedProducts = [
  104123, // Mars II, Bundeswehr
  103999, // Bergepanzer Büffel, BPz3, Bundeswehr
  104124, // SLT 50-2 Elefant, Bundeswehr
  104125, // Biber, Bundeswehr
  104518, // FlaRakPz-Roland-II,
  104597, // LKW 7t gl 6x6 Autokran 4
  104519, // Kanonenjagdpanzer 4-5 ( KanJgPZ), Bundeswehr
  104310, // Kampfhubschrauber-Tiger-Bundeswehr-Xingbao
  604840, // Metal pins for Buffer Unit X 50
];

export const ignoredProducts = [
  103239, // Container Happy Build
  104303, // Raupenlader Happy Build
  104647, // Mittelalterliche Stadt - Wassermühle UrGe
  401293, // Stickerbogen für Wandt Spedition LKW's
  104262, // Lucky Hot Pot, Chinesisches Restaurant
  101990, // Gatling Gewehr - Mini Gun
];

export const convertPartNr = {
  3943: '3943b',
};

export const ignoreProductsOnUrl = {
  'https://www.bluebrixx.com/de/bluebrixxspecials/scifi': [
    100249, // Regionalexpress DB Steuerwagen
  ],
  'https://www.bluebrixx.com/de/bluebrixx-pro': [
    104647, // Mittelalterliche Stadt - Wassermühle
  ],
};

// data/categories.json
export const IDs = {
  ID_CAT_BLUEBRIXX_SPECIAL: [0, 14],
  ID_CAT_BLUEBRIXX_PRO: [1, 19],
  ID_CAT_BLUEBRIXX: [2, 6],
  ID_CAT_CHROME_PARTS: 3,
  ID_CAT_BBX_PART_PACKS: 6,
  ID_TAG_BLUEBRIXX_SPECIAL: 0,
  ID_TAG_BLUEBRIXX_PRO: 1,
  ID_TAG_ARCHITECTURE: 2,
  ID_TAG_FIRE_RESCUE: 3,
  ID_TAG_MILITARY: 5,
  ID_TAG_VEHICLES: 6,
  ID_TAG_SCIFI: 7,
  ID_TAG_TRAIN: 8,
  ID_TAG_PLANTS: 21,
  ID_TAG_MOVIE_MODELLS: 28,
  ID_TAG_BBX_PART_PACKS: 48,
  ID_TAG_SHIPS: 51,
  ID_TAG_OTHERS: 52,
  ID_TAG_ASSORTMENT: 53,
  ID_TAG_KNIGHTS: 54,
  ID_TAG_LANDMASCHIENEN: 55,
  ID_TAG_CITY: 56,
};
// url parsing from bbx directly
export const specialsIDs = [
  IDs.ID_TAG_TRAIN,
  IDs.ID_TAG_FIRE_RESCUE,
  IDs.ID_TAG_MILITARY,
  IDs.ID_TAG_SCIFI,
  IDs.ID_TAG_VEHICLES,
  IDs.ID_TAG_PLANTS,
  IDs.ID_TAG_ARCHITECTURE,
  IDs.ID_TAG_SHIPS,
  IDs.ID_TAG_OTHERS,
  IDs.ID_TAG_ASSORTMENT,
  IDs.ID_TAG_KNIGHTS,
  IDs.ID_TAG_LANDMASCHIENEN,
  IDs.ID_TAG_CITY,
];
// https://api.bbx.watch/api/graphql?query=%7BproductCategories(first%3A6193)%7BtotalCount%2Cedges%7Bnode%20%7B_id%2Cname%7D%7D%7D%7D
export const bluebrixxOnlyCatIDs = [
  IDs.ID_CAT_BLUEBRIXX[1],
  IDs.ID_CAT_BLUEBRIXX_SPECIAL[1],
  IDs.ID_CAT_BLUEBRIXX_PRO[1],
];
export const apiCatsToWatcherIDs = [
  IDs.ID_CAT_BLUEBRIXX[0],
  IDs.ID_CAT_BLUEBRIXX_SPECIAL[0],
  IDs.ID_CAT_BLUEBRIXX_PRO[0],
];

export const isBluebrixxProduct = (product, category) => {
  const productId = product['_id']; // "_id": 603721,
  let catId = category['_id'];
  const isIgnoredProduct = ignoredProducts.includes(productId);
  const isBluebrixxProduct = bluebrixxOnlyCatIDs.includes(catId);
  return !isIgnoredProduct && (isBluebrixxProduct || (!isIgnoredProduct && isBluebrixxPart(product, category)));
};

export const isBluebrixxPart = (product, category) => {
  const titleHasAmount = product.name.includes('Stück');
  const catName = category.name;
  const isPartWithNr = catName.includes(partNrDivider);
  const catNameIsBricklinkColor = catName.replace('-', ' ') in bricklinkColors;
  return isPartWithNr || (titleHasAmount && catName.includes('BlueBrixx')) || catNameIsBricklinkColor;
};

export const updateProductData = (product, change) => {
  // add chrome color
  const titleAdditionChrome = ', Chrome Silver';
  if (
    //product.cats.includes(IDs.ID_CAT_CHROME_PARTS)
    product.title.includes('Stück') &&
    !['gemischt', 'schienen', 'gleise', 'felsenset', 'busch', 'finger leaf', 'bamboo', 'limb'].some(n =>
      product.title.toLowerCase().includes(n)
    ) &&
    (change.catId === IDs.ID_CAT_BLUEBRIXX_SPECIAL[1] || change.catName === 'BlueBrixx-Special') &&
    !product.title.includes(titleAdditionChrome)
  ) {
    product.title += titleAdditionChrome;
    product.cats.push(IDs.ID_CAT_CHROME_PARTS);
  }

  // "catName": "BlackNr.: 3828"
  // "title": "STEERING WHEEL Ø11 X 200, Black"
  const isPartWithNr = change.catName.includes(partNrDivider);
  if (isPartWithNr) {
    const [color, nr] = change.catName.split(partNrDivider);
    if (!!color) {
      product.title += ', ' + color;
    }
    product.partNr = nr in convertPartNr ? convertPartNr[nr] : nr;
  }

  const titleAdditionBricklink = change.catName.replace('-', ' ');
  const catNameIsBricklinkColor = titleAdditionBricklink in bricklinkColors;
  if (catNameIsBricklinkColor && !product.title.includes(titleAdditionBricklink)) {
    product.title += ', ' + titleAdditionBricklink;
  }

  if (change.catId) {
    const catIdWatcher = apiCatsToWatcherIDs[bluebrixxOnlyCatIDs.indexOf(change.catId)];
    // pro, special or normal
    if (catIdWatcher > -1) {
      product.cats.push(catIdWatcher);
      product.tags.push(catIdWatcher);
    }
  }

  if (isBluebrixxPart({ name: product.title }, { name: change.catName })) {
    product.cats.push(IDs.ID_CAT_BBX_PART_PACKS);
    product.tags.push(IDs.ID_TAG_BBX_PART_PACKS);
  }
  // TODO: tags merge in svelte is a problem due json import in nodejs
  //product.tags = mergeTags(tags, getTags([], title, '', '', productId));
  // remove doubles
  product.cats = mergeTags(product.cats);
  product.tags = mergeTags(product.tags);

  // 10x 20x
  if (product.parts === 0 && product.title.includes('10x')) {
    product.parts = 10;
  }
  if (product.parts === 0 && product.title.includes('20x')) {
    product.parts = 20;
  }
  if (
    product.parts === 0 &&
    (product.title.includes('32x32') ||
      product.title.includes('without Minifigure') ||
      product.title.includes('Gutschein'))
  ) {
    product.parts = 1;
  }

  return product;
};
