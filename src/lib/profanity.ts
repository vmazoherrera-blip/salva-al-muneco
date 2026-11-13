/**
 * Profanity and inappropriate name filter for educational multiplayer.
 * Covers common Spanish vulgarities, insults, offensive words,
 * Latin American idioms, leetspeak evasions, and common double-entendre puns (albures).
 */

const FORBIDDEN_WORDS = [
  // Insults & profanities (universal Spanish & regional: CO, MX, AR, ES, etc.)
  "puta",
  "puto",
  "putita",
  "putote",
  "gonorrea",
  "hijueputa",
  "hpta",
  "hp",
  "malparido",
  "malparida",
  "carechimba",
  "chimba",
  "marica",
  "maricon",
  "maricona",
  "mierda",
  "mierdero",
  "verga",
  "vergazo",
  "vergon",
  "verguero",
  "pene",
  "penis",
  "vagina",
  "vulva",
  "culo",
  "culiao",
  "culicagado",
  "culero",
  "perra",
  "perro",
  "zorra",
  "zorrillo",
  "cabron",
  "cabrona",
  "pendejo",
  "pendeja",
  "chingar",
  "chinga",
  "chingada",
  "chingatumadre",
  "tetas",
  "senos",
  "pechos",
  "coño",
  "coñazo",
  "chucha",
  "polla",
  "pollon",
  "mamaguevo",
  "mamapinga",
  "guevon",
  "guevona",
  "huevon",
  "huevona",
  "webon",
  "weon",
  "idiota",
  "imbecil",
  "estupido",
  "estupida",
  "bastardo",
  "bastarda",
  "sorete",
  "tarado",
  "tarada",
  "crap",
  "shit",
  "fuck",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "bastard",
  "nazi",
  "hitler",
  "porn",
  "porno",
  "semen",
  "orgasmo",
  "follar",
  "coger",
];

// Double entendre and vulgar puns (albures)
const FORBIDDEN_PHRASES = [
  "elver galarga",
  "elvergalarga",
  "elba surita",
  "elbasurita",
  "benito camelas",
  "benitocamelas",
  "rosa melano",
  "rosamelano",
  "deborah melo",
  "deborahmelo",
  "alma marcela",
  "almamarcela",
  "micho tito",
  "michotito",
  "aquiles baeza",
  "aquilesbaeza",
  "agapito melo",
  "agapitomelo",
  "seba calvo",
  "sebacalvo",
  "lola mento",
  "lolamento",
  "elsa pito",
  "elsapito",
  "tito teco",
  "titoteco",
  "teque teque",
];

/**
 * Normalizes a string by converting to lowercase, removing accents,
 * replacing leetspeak digits/symbols with letters, and removing symbols.
 */
function normalizeText(input: string): string {
  if (!input) return "";

  let str = input.toLowerCase();

  // Normalize accented vowels
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Leetspeak substitutions
  str = str
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/\+/g, "t");

  // Remove punctuation and special symbols
  str = str.replace(/[^a-z0-9\s]/g, " ");

  // Collapse repeated characters (e.g. "puuuuutaaa" -> "puta")
  str = str.replace(/(.)\1{2,}/g, "$1$1");

  return str.trim();
}

/**
 * Checks if a nickname or text contains inappropriate words or albures.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;

  const normalized = normalizeText(text);
  const compact = normalized.replace(/\s+/g, "");
  const collapsed = compact.replace(/(.)\1+/g, "$1");

  // 1. Check double-entendre phrases / albures
  for (const phrase of FORBIDDEN_PHRASES) {
    const normPhrase = normalizeText(phrase);
    const compactPhrase = normPhrase.replace(/\s+/g, "");
    if (normalized.includes(normPhrase) || compact.includes(compactPhrase)) {
      return true;
    }
  }

  // 2. Check individual forbidden words
  const words = normalized.split(/\s+/);
  const collapsedWords = words.map((w) => w.replace(/(.)\1+/g, "$1"));
  for (let i = 0; i < words.length; i++) {
    if (FORBIDDEN_WORDS.includes(words[i]) || FORBIDDEN_WORDS.includes(collapsedWords[i])) {
      return true;
    }
  }

  // 3. Substring check for severe words inside compound names (e.g. "sofiaputa", "puuuuutaaa")
  const severeRoots = [
    "puta",
    "puto",
    "gonorrea",
    "hijueputa",
    "malparid",
    "carechimb",
    "verga",
    "pene",
    "vagina",
    "chinga",
    "coño",
    "polla",
    "mamaguev",
    "mierda",
    "hitler",
    "nazi",
  ];

  for (const root of severeRoots) {
    if (compact.includes(root) || collapsed.includes(root)) {
      return true;
    }
  }

  return false;
}
