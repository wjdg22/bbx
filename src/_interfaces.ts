// Die ausgehenden Links "Zum Shop" von jedem Produkt sind mit einen Affiliate Link versehen.
// Mit einem Klick und anschließendem Kauf unterstütz du dieses Projekt.
// Wir selbst düfen noch kein Partner von Bluebrixx sein daher bekommt temporär noppensteinnews die Provision.
// Die ist der Fall weil ich zu Gast im Podcast über dieses Projekt sprechen durfte
export const AFF_LINK = '?aff=wrhjxrxb';
// ID Stuff
export const ID_MANHATTAN = 17;
export const STR_MANHATTAN = 'Manhattan';
export const ID_NETHERLAND = 57;
export const STR_NETHERLAND = 'niederländische Hausfassade';
export const ID_BURG_BLAUSTEIN = 39;
export const STR_BURG_BLAUSTEIN = 'Burg Blaustein';
export const ID_MOVIE = 28;
export const ID_PARTS = 48;
export const ID_STAR_TREK = 49;
export const ID_CAT_CHROME_PARTS = 3;
export const STR_STAR_TREK = 'Star Trek';
export const ID_STATE_AVAILABLE = 0;
export const ID_STATE_COMING_SOON = 1;
export const ID_STATE_UNAVAILABLE = 2;
export const ID_STATE_ANNOUNCEMENT = 3;
export const IDS_SPECIAL_TAGS = [ID_PARTS, ID_MANHATTAN, ID_MOVIE, ID_NETHERLAND, ID_BURG_BLAUSTEIN];
// Localstorage
export const lsKeyWelcome = 'welcome';

export interface Tag {
  id: number;
  name: string;
}
// external data
export const UNLOADED = 'unloaded';
export const LOADING = 'loading';
export const LOADED = 'loaded';
