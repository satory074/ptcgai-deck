// デッキ表示まわりの型・定数・整形ヘルパー（DOM 非依存）。

export interface Move {
  name: string;
  kind: "ability" | "attack";
  cost: number | null;
  damage: number | null;
}

export interface Card {
  name: string;
  count: number;
  category: "Pokémon" | "Trainer" | "Energy";
  subtype: string;
  type: string | null;
  hp: number | null;
  retreat: number | null;
  weakness: string | null;
  moves: Move[];
  image?: string | null;
  imageLarge?: string | null;
}

export interface SubGroup {
  label: string | null;
  cards: Card[];
}

export interface Section {
  key: string;
  label: string;
  subtotal: number;
  groups: SubGroup[];
}

export interface Change {
  date?: string;
  type: "in" | "out" | "note";
  name?: string;
  count?: number;
  reason: string;
}

/** ラダーμ（版ごと）。top-level ladder と同形。 */
export interface Ladder {
  submissionRef: string;
  mu: number | null;
  asOf: string;
  status: string;
  note?: string;
}

/** 由来: 自作系譜 / コピー上位リストの移植 / ローダー不具合で意図せず出荷されたフォールバック。 */
export type Origin = "own" | "ported" | "fallback";

/** 日付（バージョン）ごとのフル60枚スナップショット。selector で切り替える単位。 */
export interface Snapshot {
  id: string;
  date: string;
  label: string;
  archetype: string;
  rationale: string;
  energyIdentity: string;
  origin?: Origin;
  ladder?: Ladder;
  changes: Change[];
  cards: Card[];
}

/** 由来バッジのメタ（表示名・色トークン）。own=緑 / ported=青 / fallback=赤。 */
export const ORIGIN_META: Record<Origin, { jp: string; desc: string; color: string; bg: string }> = {
  own: { jp: "自作", desc: "自分で設計したデッキ", color: "var(--color-in)", bg: "var(--color-in-bg)" },
  ported: { jp: "移植", desc: "公開上位リストの移植（出典明記・検証対象はパイロット）", color: "var(--color-ported)", bg: "var(--color-ported-bg)" },
  fallback: { jp: "フォールバック", desc: "ローダー不具合で意図せず出荷（実測は無効）", color: "var(--color-out)", bg: "var(--color-out-bg)" },
};

export function originMeta(o?: Origin | string | null) {
  return ORIGIN_META[(o as Origin) in ORIGIN_META ? (o as Origin) : "own"];
}

/** デッキの代表タイプ記号（ポケモン＋基本エネの枚数で最多のもの）。ヘッダのタイプバッジ用。 */
export function primaryType(cards: Card[]): string | null {
  const tally: Record<string, number> = {};
  for (const c of cards) {
    if (!c.type) continue;
    if (c.category === "Pokémon" || (c.category === "Energy" && c.subtype === "Basic")) {
      tally[c.type] = (tally[c.type] ?? 0) + c.count;
    }
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [t, n] of Object.entries(tally)) {
    if (n > bestN) {
      best = t;
      bestN = n;
    }
  }
  return best;
}

/** ポケカ11タイプのメタ（記号 → 表示名・色・略号）。現状デッキは {F} のみだが将来用に全タイプ定義。 */
export const TYPE_META: Record<
  string,
  { label: string; jp: string; color: string; text: string; abbr: string }
> = {
  "{G}": { label: "Grass", jp: "草", color: "#4a9b54", text: "#ffffff", abbr: "G" },
  "{R}": { label: "Fire", jp: "炎", color: "#e2533a", text: "#ffffff", abbr: "R" },
  "{W}": { label: "Water", jp: "水", color: "#3a8fd0", text: "#ffffff", abbr: "W" },
  "{L}": { label: "Lightning", jp: "雷", color: "#e0b62c", text: "#1a1407", abbr: "L" },
  "{P}": { label: "Psychic", jp: "超", color: "#9457a3", text: "#ffffff", abbr: "P" },
  "{F}": { label: "Fighting", jp: "闘", color: "#d4763a", text: "#1a1006", abbr: "F" },
  "{D}": { label: "Darkness", jp: "悪", color: "#4f4f5c", text: "#ffffff", abbr: "D" },
  "{M}": { label: "Metal", jp: "鋼", color: "#8a93a3", text: "#15171c", abbr: "M" },
  "{N}": { label: "Dragon", jp: "竜", color: "#b8902e", text: "#15120a", abbr: "N" },
  "{Y}": { label: "Fairy", jp: "妖", color: "#d46aa0", text: "#ffffff", abbr: "Y" },
  "{C}": { label: "Colorless", jp: "無", color: "#b8b3a8", text: "#1a1814", abbr: "C" },
};

export function typeMeta(sym?: string | null) {
  return (sym && TYPE_META[sym]) || null;
}

const SUBTYPE_LABEL_JP: Record<string, string> = {
  Basic: "たね",
  "Stage 1": "1進化",
  "Stage 2": "2進化",
  Supporter: "サポート",
  Item: "グッズ",
  Stadium: "スタジアム",
  Tool: "ポケモンのどうぐ",
  Special: "特殊エネルギー",
};

export function subtypeLabel(subtype: string): string {
  return SUBTYPE_LABEL_JP[subtype] ?? subtype;
}

const sum = (cards: Card[]) => cards.reduce((s, c) => s + c.count, 0);

/** カード配列を「ポケモン / トレーナーズ(サポート・グッズ…) / エネルギー」の表示セクションへ。 */
export function buildSections(cards: Card[]): Section[] {
  const byCat = (cat: Card["category"]) => cards.filter((c) => c.category === cat);
  const sections: Section[] = [];

  const poke = byCat("Pokémon");
  if (poke.length) {
    sections.push({ key: "pokemon", label: "ポケモン", subtotal: sum(poke), groups: [{ label: null, cards: poke }] });
  }

  const trainer = byCat("Trainer");
  if (trainer.length) {
    const order = ["Supporter", "Item", "Stadium", "Tool"];
    const groups: SubGroup[] = order
      .map((st) => ({ label: subtypeLabel(st), cards: trainer.filter((c) => c.subtype === st) }))
      .filter((g) => g.cards.length);
    // 想定外サブタイプが残ったら最後にまとめて出す（取りこぼし防止）。
    const known = new Set(order);
    const rest = trainer.filter((c) => !known.has(c.subtype));
    if (rest.length) groups.push({ label: "その他", cards: rest });
    sections.push({ key: "trainer", label: "トレーナーズ", subtotal: sum(trainer), groups });
  }

  const energy = byCat("Energy");
  if (energy.length) {
    sections.push({ key: "energy", label: "エネルギー", subtotal: sum(energy), groups: [{ label: null, cards: energy }] });
  }

  return sections;
}

/** 「2エネ」表記。abilities は cost=null。 */
export function formatCost(cost: number | null): string {
  if (cost == null) return "";
  return cost === 0 ? "無" : `${cost}エネ`;
}

/** カードを枚数ぶん展開（60枚すべてを1枚ずつタイル化するため）。各コピーに通し番号を付ける。 */
export function expandCopies(cards: Card[]): { card: Card; copy: number }[] {
  const out: { card: Card; copy: number }[] = [];
  for (const card of cards) {
    for (let i = 0; i < card.count; i++) out.push({ card, copy: i });
  }
  return out;
}

/** ポケモンの主要技ダメージ（attack のうち最大）。技が無い/ダメージ無しなら null。 */
export function mainDamage(card: Card): number | null {
  const dmgs = card.moves
    .filter((m) => m.kind === "attack" && m.damage != null)
    .map((m) => m.damage as number);
  return dmgs.length ? Math.max(...dmgs) : null;
}
