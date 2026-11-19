// Finnish strings. Same keys as en.js.

const AMOUNT_XY = { 1: 'vähän ', 2: '', 3: 'paljon ' };
const AMOUNT_D = { 1: 'vähän ', 2: '' };

export default {
  lang: 'fi',

  /**
   * @param {{x:number,y:number,d:number}|null} lv levels, null = no face
   */
  describe(lv) {
    if (!lv) return 'ei kasvoja';
    const parts = [];
    if (lv.x) parts.push(AMOUNT_XY[Math.abs(lv.x)] + (lv.x < 0 ? 'vasemmalla' : 'oikealla'));
    if (lv.y) parts.push(AMOUNT_XY[Math.abs(lv.y)] + (lv.y < 0 ? 'alhaalla' : 'ylhäällä'));
    if (lv.d) parts.push(AMOUNT_D[Math.abs(lv.d)] + (lv.d < 0 ? 'kaukana' : 'lähellä'));
    return parts.length ? parts.join(', ') : 'keskellä';
  },

  status: {
    loading: 'Ladataan kasvojentunnistusta',
    started: (camera) => `Käynnistetty. ${camera}`,
    stopped: 'Pysäytetty',
    camera: (label) => `Kamera: ${label}`,
    cameraUnnamed: (n) => `Kamera ${n}`,
    cameraDefault: 'Oletuskamera',
    cameraNone: 'Ei valittu, paina Käynnistä',
    inUseNone: 'ei mikään',
    cameraGone: 'Kameran yhteys katkesi',
    idealSet: 'Ihanneetäisyys asetettu',
    idealReset: 'Ihanneetäisyys palautettu',
    idealNoFace: 'Ei kasvoja, ihanneetäisyyttä ei asetettu',
    notRunning: 'Ei käynnissä',
    errPermission: 'Kameran käyttö estetty. Salli kamera osoiterivillä ja paina Käynnistä.',
    errNoCamera: 'Kameraa ei löytynyt',
    errInUse: 'Kamera on toisen sovelluksen käytössä tai sitä ei voi avata',
    errDetector: 'Kasvojentunnistuksen lataus epäonnistui',
    errGeneric: (msg) => `Virhe: ${msg}`,
  },

  ui: {
    title: 'Kasvojen keskitys',
    description: 'Kertoo puheella ja äänillä, ovatko kasvosi keskellä web-kameran kuvaa.',
    start: 'Käynnistä',
    stop: 'Pysäytä',
    where: 'Missä olen',

    cameraHeading: 'Kamera',
    camera: 'Kamera',
    inUse: 'Käytössä:',
    swapLeftRight: 'Vaihda vasen ja oikea (vain jos vasen ja oikea ovat väärin päin)',

    settingsHeading: 'Asetukset',
    language: 'Kieli',
    feedback: 'Palaute',
    outputBoth: 'Puhe ja äänet',
    outputSpeech: 'Vain puhe',
    outputSound: 'Vain äänet',

    position: 'Sijainti',
    tolerance: 'Keskialue',
    toleranceTight: 'Pieni',
    toleranceNormal: 'Keskikokoinen',
    toleranceLoose: 'Suuri',
    distance: 'Etäisyyspalaute (lähellä, kaukana)',
    setIdeal: 'Aseta nykyinen etäisyys ihanteeksi',
    resetIdeal: 'Palauta ihanneetäisyys',

    speech: 'Puhe',
    speechDelay: 'Viive ennen puhetta',
    delayShort: 'Lyhyt',
    delayMedium: 'Keskipitkä',
    delayLong: 'Pitkä',
    liveMode: 'Uusi sijainti',
    liveAssertive: 'Keskeyttää puheen',
    livePolite: 'Odottaa puheen loppumista',

    sounds: 'Äänet',
    volume: 'Äänenvoimakkuus',
    blipInterval: 'Piippausten nopeus',
    blipSlow: 'Hidas',
    blipMedium: 'Keskinopea',
    blipFast: 'Nopea',
    centeredTick: 'Hiljainen tikitys, kun olet keskellä',
    previewOff: 'Soita piippaus',
    previewCentered: 'Soita keskellä-ääni',
    previewNone: 'Soita kasvot kadonneet -ääni',

    helpHeading: 'Ohje',
    helpIntro: 'Paina Käynnistä ja salli kameran käyttö. Suunnat ovat omasta näkökulmastasi.',
    helpSpeech: 'Puhe: ensin vasemmalla tai oikealla, sitten ylhäällä tai alhaalla, sitten etäisyys. Kukin voi olla "vähän", pelkkä tai "paljon". "Keskellä" tarkoittaa, että kaikki on kunnossa.',
    helpSounds: 'Äänet: piippaukset siirtyvät vasemmalle tai oikealle kasvojesi mukana. Ne ovat korkeampia, kun kasvosi ovat ylhäällä, ja matalampia, kun ne ovat alhaalla. Kun olet keskellä, piippaukset loppuvat ja kuuluu nouseva kilahdus. Laskeva ääni tarkoittaa, että kasvot katosivat.',
    helpDistance: 'Etäisyys: jos piippaukset jatkuvat keskeltä, vaikka olet keskellä, olet liian lähellä tai liian kaukana. Istu haluamaasi kohtaan ja paina "Aseta nykyinen etäisyys ihanteeksi".',
    helpShortcuts: 'Pikanäppäimet: Alt+Shift+W kertoo, missä olet. Alt+Shift+S käynnistää tai pysäyttää.',
    helpPrivacy: 'Yksityisyys: kaikki tapahtuu selaimessasi. Video ei koskaan lähde tietokoneeltasi.',
    helpSource: 'Lähdekoodi ja ohjeet GitHubissa',
  },
};
