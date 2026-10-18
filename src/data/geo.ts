/**
 * Seas, rivers and mountain ranges for the geography quiz. Each entry has the
 * Dutch name the player types, and where its shape comes from:
 *
 * - `ne`: Natural Earth 1:10m (public domain). `names` are the names in that
 *   layer; a river is often split into named stretches (Jinsha, Chang Jiang and
 *   Yangtze are one river), so it lists all of them. `bbox` keeps a name that
 *   occurs twice (the Colorado in the US and in Argentina) to the right one.
 * - `osm`: an OpenStreetMap relation (© OpenStreetMap contributors, ODbL), for
 *   the Belgian rivers Natural Earth does not have.
 *
 * `scripts/build-geo-map.mjs` turns this into `public/geo/geo.json`; see
 * docs/aardrijkskunde.md. Ids are stable: they key the history.
 */

export type GeoKind = 'zee' | 'rivier' | 'gebergte';

/** The series on the setup screen. */
export type GeoGroup = 'zeeen' | 'rivieren-be' | 'rivieren' | 'gebergtes';

export const GEO_GROUPS: GeoGroup[] = ['zeeen', 'rivieren-be', 'rivieren', 'gebergtes'];

type NeLayer = 'marine' | 'rivers' | 'rivers-europe' | 'regions';

export interface GeoEntry {
  id: string;
  name: string;
  aliases?: string[];
  kind: GeoKind;
  group: GeoGroup;
  ne?: { layer: NeLayer; names: string[]; bbox?: [number, number, number, number] };
  osm?: number;
}

const sea = (id: string, name: string, names: string[], aliases?: string[]): GeoEntry => ({
  id,
  name,
  kind: 'zee',
  group: 'zeeen',
  ne: { layer: 'marine', names },
  ...(aliases && { aliases }),
});

const river = (
  id: string,
  name: string,
  names: string[],
  options: { aliases?: string[]; bbox?: [number, number, number, number]; layer?: NeLayer } = {},
): GeoEntry => ({
  id,
  name,
  kind: 'rivier',
  group: 'rivieren',
  ne: {
    layer: options.layer ?? 'rivers',
    names,
    ...(options.bbox && { bbox: options.bbox }),
  },
  ...(options.aliases && { aliases: options.aliases }),
});

const beRiver = (id: string, name: string, osm: number, aliases?: string[]): GeoEntry => ({
  id,
  name,
  kind: 'rivier',
  group: 'rivieren-be',
  osm,
  ...(aliases && { aliases }),
});

const range = (id: string, name: string, names: string[], aliases?: string[]): GeoEntry => ({
  id,
  name,
  kind: 'gebergte',
  group: 'gebergtes',
  ne: { layer: 'regions', names },
  ...(aliases && { aliases }),
});

export const GEO: GeoEntry[] = [
  // Oceans and seas
  sea(
    'atlantische-oceaan',
    'Atlantische Oceaan',
    ['North Atlantic Ocean', 'South Atlantic Ocean'],
    ['Atlantic Ocean'],
  ),
  sea(
    'grote-oceaan',
    'Grote Oceaan',
    ['North Pacific Ocean', 'South Pacific Ocean'],
    ['Stille Oceaan', 'Pacific Ocean'],
  ),
  sea('indische-oceaan', 'Indische Oceaan', ['INDIAN OCEAN']),
  sea('noordelijke-ijszee', 'Noordelijke IJszee', ['Arctic Ocean']),
  sea('zuidelijke-oceaan', 'Zuidelijke Oceaan', ['SOUTHERN OCEAN']),
  sea('noordzee', 'Noordzee', ['North Sea']),
  sea('het-kanaal', 'Het Kanaal', ['English Channel'], ['Kanaal', 'Lamanche']),
  sea('waddenzee', 'Waddenzee', ['Waddenzee']),
  sea('oostzee', 'Oostzee', ['Baltic Sea']),
  sea('ierse-zee', 'Ierse Zee', ['Irish Sea']),
  sea('noorse-zee', 'Noorse Zee', ['Norwegian Sea']),
  sea('barentszzee', 'Barentszzee', ['Barents Sea']),
  sea('witte-zee', 'Witte Zee', ['White Sea']),
  sea('golf-van-biskaje', 'Golf van Biskaje', ['Bay of Biscay']),
  sea('middellandse-zee', 'Middellandse Zee', ['Mediterranean Sea']),
  sea('adriatische-zee', 'Adriatische Zee', ['Adriatic Sea']),
  sea('egeische-zee', 'Egeïsche Zee', ['Aegean Sea']),
  sea('tyrreense-zee', 'Tyrreense Zee', ['Tyrrhenian Sea']),
  sea('ionische-zee', 'Ionische Zee', ['Ionian Sea']),
  sea('ligurische-zee', 'Ligurische Zee', ['Ligurian Sea']),
  sea('zwarte-zee', 'Zwarte Zee', ['Black Sea']),
  sea('kaspische-zee', 'Kaspische Zee', ['Caspian Sea']),
  sea('rode-zee', 'Rode Zee', ['Red Sea']),
  sea('perzische-golf', 'Perzische Golf', ['Persian Gulf'], ['Arabische Golf']),
  sea('arabische-zee', 'Arabische Zee', ['Arabian Sea']),
  sea('golf-van-bengalen', 'Golf van Bengalen', ['Bay of Bengal']),
  sea('zuid-chinese-zee', 'Zuid-Chinese Zee', ['South China Sea']),
  sea('oost-chinese-zee', 'Oost-Chinese Zee', ['East China Sea']),
  sea('gele-zee', 'Gele Zee', ['Yellow Sea']),
  sea('japanse-zee', 'Japanse Zee', ['Sea of Japan']),
  sea('beringzee', 'Beringzee', ['Bering Sea']),
  sea('koraalzee', 'Koraalzee', ['Coral Sea']),
  sea('tasmanzee', 'Tasmanzee', ['Tasman Sea']),
  sea('caraibische-zee', 'Caraïbische Zee', ['Caribbean Sea']),
  sea('golf-van-mexico', 'Golf van Mexico', ['Gulf of Mexico']),
  sea('hudsonbaai', 'Hudsonbaai', ['Hudson Bay']),
  sea('golf-van-guinee', 'Golf van Guinee', ['Gulf of Guinea']),

  // Belgian rivers (OpenStreetMap)
  beRiver('schelde', 'Schelde', 324288, ['Escaut']),
  beRiver('maas', 'Maas', 1075197, ['Meuse']),
  beRiver('leie', 'Leie', 1201127, ['Lys']),
  beRiver('ijzer', 'IJzer', 1364262, ['Yser']),
  beRiver('dender', 'Dender', 11154751, ['Dendre']),
  beRiver('demer', 'Demer', 12994474),
  beRiver('dijle', 'Dijle', 2469797, ['Dyle']),
  beRiver('nete', 'Nete', 10309979),
  beRiver('zenne', 'Zenne', 2430630, ['Senne']),
  beRiver('durme', 'Durme', 324290),
  beRiver('samber', 'Samber', 1600647, ['Sambre']),
  beRiver('ourthe', 'Ourthe', 2246211),
  beRiver('semois', 'Semois', 1727715),
  beRiver('lesse', 'Lesse', 14099653),
  beRiver('vesder', 'Vesder', 12117339, ['Vesdre']),
  beRiver('ambleve', 'Amblève', 12641506, ['Amel', 'Ambleve']),
  beRiver('gete', 'Gete', 20678700),

  // Well-known rivers abroad
  river('rijn', 'Rijn', ['Rhine', 'Rhein'], { aliases: ['Rhein', 'Rhine'] }),
  river('waal', 'Waal', ['Waal']),
  river('ijssel', 'IJssel', ['IJssel']),
  river('seine', 'Seine', ['Seine']),
  river('loire', 'Loire', ['Loire']),
  river('rhone', 'Rhône', ['Rhône']),
  river('garonne', 'Garonne', ['Garonne']),
  river('moezel', 'Moezel', ['Mosel'], { aliases: ['Moselle', 'Mosel'] }),
  river('main', 'Main', ['Main']),
  river('elbe', 'Elbe', ['Elbe'], { bbox: [9, 49, 17, 55] }),
  river('weser', 'Weser', ['Weser']),
  river('oder', 'Oder', ['Oder'], { bbox: [13, 49, 19, 55] }),
  river('donau', 'Donau', ['Donau', 'Danube'], { aliases: ['Danube'] }),
  river('po', 'Po', ['Po']),
  river('tiber', 'Tiber', ['Tevere'], { aliases: ['Tevere'] }),
  river('theems', 'Theems', ['Thames'], { aliases: ['Thames'] }),
  river('taag', 'Taag', ['Tejo'], { aliases: ['Tejo', 'Tajo'] }),
  river('ebro', 'Ebro', ['Ebro']),
  river('wisla', 'Wisła', ['Vistula'], { aliases: ['Weichsel', 'Vistula', 'Wisla'] }),
  river('wolga', 'Wolga', ['Volga'], { aliases: ['Volga'], bbox: [32, 45, 51, 59] }),
  river('dnjepr', 'Dnjepr', ['Dnipro'], { aliases: ['Dnipro', 'Dnepr'] }),
  river('nijl', 'Nijl', ['Nile', 'Bahr el Jebel'], { aliases: ['Nile'] }),
  river('congo', 'Congo', ['Congo', 'Lualaba']),
  river('niger', 'Niger', ['Niger']),
  river('zambezi', 'Zambezi', ['Zambezi']),
  river('tigris', 'Tigris', ['Tigris']),
  river('eufraat', 'Eufraat', ['Euphrates'], { aliases: ['Euphraat', 'Euphrates'] }),
  river('jordaan', 'Jordaan', ['Jordan'], { aliases: ['Jordan'] }),
  river('ganges', 'Ganges', ['Ganges']),
  river('indus', 'Indus', ['Indus']),
  river('jangtsekiang', 'Jangtsekiang', ['Yangtze', 'Chang Jiang', 'Jinsha'], {
    aliases: ['Yangtze', 'Blauwe Rivier', 'Chang Jiang'],
  }),
  river('gele-rivier', 'Gele Rivier', ['Huang'], { aliases: ['Huang He', 'Hoangho'] }),
  river('mekong', 'Mekong', ['Mekong', 'Lancang']),
  river('ob', 'Ob', ['Ob']),
  river('jenisej', 'Jenisej', ['Yenisey'], { aliases: ['Yenisey', 'Jenisei'] }),
  river('lena', 'Lena', ['Lena']),
  river('mississippi', 'Mississippi', ['Mississippi']),
  river('missouri', 'Missouri', ['Missouri']),
  river('colorado', 'Colorado', ['Colorado'], { bbox: [-120, 30, -100, 42] }),
  river('rio-grande', 'Rio Grande', ['Rio Grande']),
  river('sint-laurensrivier', 'Sint-Laurensrivier', ['St. Lawrence'], {
    aliases: ['Saint Lawrence', 'Sint-Laurens'],
  }),
  river('yukon', 'Yukon', ['Yukon']),
  river('amazone', 'Amazone', ['Amazonas'], { aliases: ['Amazonas', 'Amazon'] }),
  river('orinoco', 'Orinoco', ['Orinoco']),
  river('parana', 'Paraná', ['Paraná']),
  river('murray', 'Murray', ['Murray'], { bbox: [138, -38, 149, -33] }),

  // Mountain ranges
  range('alpen', 'Alpen', ['ALPS'], ['Alps']),
  range('pyreneeen', 'Pyreneeën', ['PYRENEES'], ['Pyreneeen']),
  range('ardennen', 'Ardennen', ['Ardennes']),
  range('vogezen', 'Vogezen', ['Vosges'], ['Vosges']),
  range('jura', 'Jura', ['Jura']),
  range('centraal-massief', 'Centraal Massief', ['Massif Central'], ['Massif Central']),
  range('harz', 'Harz', ['Harz']),
  range('ertsgebergte', 'Ertsgebergte', ['Erzgebirge'], ['Erzgebirge']),
  range('apennijnen', 'Apennijnen', ['APPENNINI'], ['Apennijnen', 'Appennini']),
  range('karpaten', 'Karpaten', ['CARPATHIAN MOUNTAINS']),
  range('kaukasus', 'Kaukasus', ['CAUCASUS MTS.']),
  range('oeral', 'Oeral', ['URAL MOUNTAINS'], ['Ural']),
  range('balkangebergte', 'Balkangebergte', ['Balkan Mts.'], ['Balkan']),
  range('dinarische-alpen', 'Dinarische Alpen', ['Dinaric Alps']),
  range('cantabrisch-gebergte', 'Cantabrisch Gebergte', ['Cord. Cantábrica']),
  range(
    'scandinavisch-hoogland',
    'Scandinavisch Hoogland',
    ['KJØLEN MOUNTAINS'],
    ['Scandinavische Alpen'],
  ),
  range('atlasgebergte', 'Atlasgebergte', ['ATLAS MOUNTAINS'], ['Atlas']),
  range('drakensbergen', 'Drakensbergen', ['DRAKENSBERG'], ['Drakensberg']),
  range('ethiopisch-hoogland', 'Ethiopisch Hoogland', ['ETHIOPIAN HIGHLANDS']),
  range('himalaya', 'Himalaya', ['HIMALAYAS']),
  range('karakoram', 'Karakoram', ['KARAKORAM RA.']),
  range('hindoekoesj', 'Hindoekoesj', ['HINDU KUSH'], ['Hindu Kush']),
  range('tiensjan', 'Tiensjan', ['TIAN SHAN'], ['Tian Shan']),
  range('altaj', 'Altaj', ['ALTAY MOUNTAINS'], ['Altai']),
  range('zagrosgebergte', 'Zagrosgebergte', ['ZAGROS MOUNTAINS'], ['Zagros']),
  range('taurus', 'Taurus', ['Taurus Mts.']),
  range('rocky-mountains', 'Rocky Mountains', ['ROCKY MOUNTAINS'], ['Rotsgebergte']),
  range('appalachen', 'Appalachen', ['APPALACHIAN MTS.'], ['Appalachian Mountains']),
  range('andes', 'Andes', ['ANDES']),
  range(
    'groot-australisch-scheidingsgebergte',
    'Groot Australisch Scheidingsgebergte',
    ['GREAT DIVIDING RANGE'],
    ['Great Dividing Range'],
  ),
  range('nieuw-zeelandse-alpen', 'Nieuw-Zeelandse Alpen', ['SOUTHERN ALPS'], ['Southern Alps']),
];
