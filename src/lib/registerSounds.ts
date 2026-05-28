// レジ玩具風の効果音定義とバーコード分類ロジック。
// バーコード読み取り直後、検索処理とは独立して即時再生するために使う。

export type BarcodeCategory =
  | "book"
  | "instore_price_possible"
  | "instore"
  | "japan_product"
  | "general_product"
  | "unknown";

const AUDIO_BASE = "/audio/register";

// カテゴリごとの音声ファイル（unknown以外は4種類からランダム再生）
export const CATEGORY_SOUNDS: Record<
  Exclude<BarcodeCategory, "unknown">,
  readonly string[]
> = {
  book: [
    `${AUDIO_BASE}/book_01.mp3`,
    `${AUDIO_BASE}/book_02.mp3`,
    `${AUDIO_BASE}/book_03.mp3`,
    `${AUDIO_BASE}/book_04.mp3`,
  ],
  instore_price_possible: [
    `${AUDIO_BASE}/instore_price_01.mp3`,
    `${AUDIO_BASE}/instore_price_02.mp3`,
    `${AUDIO_BASE}/instore_price_03.mp3`,
    `${AUDIO_BASE}/instore_price_04.mp3`,
  ],
  instore: [
    `${AUDIO_BASE}/instore_01.mp3`,
    `${AUDIO_BASE}/instore_02.mp3`,
    `${AUDIO_BASE}/instore_03.mp3`,
    `${AUDIO_BASE}/instore_04.mp3`,
  ],
  japan_product: [
    `${AUDIO_BASE}/japan_01.mp3`,
    `${AUDIO_BASE}/japan_02.mp3`,
    `${AUDIO_BASE}/japan_03.mp3`,
    `${AUDIO_BASE}/japan_04.mp3`,
  ],
  general_product: [
    `${AUDIO_BASE}/general_01.mp3`,
    `${AUDIO_BASE}/general_02.mp3`,
    `${AUDIO_BASE}/general_03.mp3`,
    `${AUDIO_BASE}/general_04.mp3`,
  ],
};

// レア音声（10%の確率で再生）
export const RARE_SOUNDS: readonly string[] = [
  `${AUDIO_BASE}/rare_01.mp3`,
  `${AUDIO_BASE}/rare_02.mp3`,
];

// 不明コード用
export const UNKNOWN_SOUND = `${AUDIO_BASE}/unknown_01.mp3`;

const RARE_PROBABILITY = 0.1;

function pickRandom<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * バーコード文字列をカテゴリに分類する。
 * 数字以外を含む / 桁数が不正なものは "unknown"。
 */
export function classifyBarcode(code: string): BarcodeCategory {
  const c = (code ?? "").trim();

  // 数字以外を含む → unknown
  if (!/^\d+$/.test(c)) return "unknown";

  const len = c.length;

  if (len === 13) {
    const p2 = c.slice(0, 2);
    const p3 = c.slice(0, 3);

    // 978/979 → ISBN（書籍）
    if (p3 === "978" || p3 === "979") return "book";

    // 02 始まりは instore_price_possible を優先
    if (p2 === "02") return "instore_price_possible";

    // 20〜29 始まりは店内コード
    const n2 = Number(p2);
    if (n2 >= 20 && n2 <= 29) return "instore";

    // 45 / 49 始まりは日本の商品
    if (p2 === "45" || p2 === "49") return "japan_product";

    // 13桁だがどれにも当てはまらない → 一般商品扱い（検索は可能）
    return "general_product";
  }

  // 8桁の短縮JANは日本の商品扱い
  if (len === 8) return "japan_product";

  // 12桁のUPC
  if (len === 12) return "general_product";

  // それ以外の桁数は不正 → unknown
  return "unknown";
}

/**
 * classifyBarcode(code) !== "unknown" なら検索可能。
 */
export function isSearchableBarcode(code: string): boolean {
  return classifyBarcode(code) !== "unknown";
}

/**
 * 再生する音声ファイルのパスを決定する。
 * - unknown: unknown_01.mp3
 * - それ以外: 10%でレア、残りはカテゴリ配列からランダム
 */
export function pickRegisterSound(code: string): string {
  const category = classifyBarcode(code);

  if (category === "unknown") return UNKNOWN_SOUND;

  if (Math.random() < RARE_PROBABILITY) {
    return pickRandom(RARE_SOUNDS);
  }

  return pickRandom(CATEGORY_SOUNDS[category]);
}

export type PlayedRegisterSound = {
  category: BarcodeCategory;
  sound: string;
};

// パスごとに Audio 要素をキャッシュして事前読み込みしておく。
// こうすると再生時にネットワーク待ちが無く、検索タブ（window.open）が
// フォーカスを奪う前にユーザー操作の延長で確実に再生を開始できる。
const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(path: string): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  let audio = audioCache.get(path);
  if (!audio) {
    audio = new Audio(path);
    audio.preload = "auto";
    audioCache.set(path, audio);
  }
  return audio;
}

function allSoundPaths(): string[] {
  const paths: string[] = [];
  for (const list of Object.values(CATEGORY_SOUNDS)) paths.push(...list);
  paths.push(...RARE_SOUNDS, UNKNOWN_SOUND);
  return paths;
}

/**
 * 全音声を事前読み込みしてキャッシュを温める。マウント時などに呼ぶ。
 */
export function preloadRegisterSounds(): void {
  if (typeof Audio === "undefined") return;
  for (const path of allSoundPaths()) {
    getAudio(path)?.load();
  }
}

/**
 * バーコード読み取り直後に即時再生する。
 * 検索処理とは独立して動作し、再生失敗してもUIや検索は止めない。
 * バーコード入力イベント（ユーザー操作）から呼ぶ前提。
 *
 * @returns 選ばれたカテゴリと音声パス（ログ/テスト表示用）
 */
export function playRegisterSound(code: string): PlayedRegisterSound {
  const category = classifyBarcode(code);
  const sound = pickRegisterSound(code);

  try {
    const audio = getAudio(sound);
    if (audio) {
      // 同じクリップが再生中でも頭から鳴らし直す
      audio.currentTime = 0;
      // play() は Promise を返すので、自動再生制限などで失敗しても握りつぶさず警告に留める
      void audio.play().catch((err) => {
        console.warn("[registerSounds] 音声の再生に失敗しました:", sound, err);
      });
    }
  } catch (err) {
    console.warn("[registerSounds] Audio の再生に失敗しました:", sound, err);
  }

  return { category, sound };
}
