import { defineCollection, z } from "astro:content";
import data from "./data/deck.json";

// 単一ファイル src/data/deck.json（private な ptcgai 側の生成器が出力）の current を
// 1エントリのコレクションとして供給する inline loader。Zod の .refine で「合計60枚」を
// ビルド時に強制する（不正なら astro check / build が落ちる）。meta / ladder / history は
// index.astro が JSON を直接 import して使う。

const moveSchema = z.object({
  name: z.string(),
  kind: z.enum(["ability", "attack"]),
  cost: z.number().int().nullable(),
  damage: z.number().int().nullable(),
});

const cardSchema = z.object({
  name: z.string(),
  count: z.number().int().positive(),
  category: z.enum(["Pokémon", "Trainer", "Energy"]),
  subtype: z.string(),
  type: z.string().nullable(),
  hp: z.number().int().nullable(),
  retreat: z.number().int().nullable(),
  weakness: z.string().nullable(),
  moves: z.array(moveSchema).default([]),
  image: z.string().url().nullable().optional(),
  imageLarge: z.string().url().nullable().optional(),
});

const changeSchema = z.object({
  date: z.string().optional(),
  type: z.enum(["in", "out", "note"]),
  name: z.string().optional(),
  count: z.number().int().positive().optional(),
  reason: z.string(),
});

// 各スナップショットのラダーμ（過去版含め版ごとに表示）。省略時は top-level ladder にフォールバック。
const ladderSchema = z.object({
  submissionRef: z.string(),
  mu: z.number(),
  asOf: z.string(),
  status: z.string(),
  note: z.string().optional(),
});

// 1エントリ＝1スナップショット（日付ごとのフル60枚デッキ）。合計60を各スナップショットで強制。
const deck = defineCollection({
  loader: () => data.snapshots.map((s) => ({ ...s })),
  schema: z
    .object({
      id: z.string(),
      date: z.coerce.date(),
      label: z.string(),
      archetype: z.string(),
      rationale: z.string(),
      energyIdentity: z.string(),
      // 由来: own=自作系譜 / ported=コピー上位リストの移植 / fallback=ローダー不具合で意図せず出荷。
      origin: z.enum(["own", "ported", "fallback"]).default("own"),
      ladder: ladderSchema.optional(),
      changes: z.array(changeSchema).default([]),
      cards: z.array(cardSchema).min(1),
    })
    .refine((v) => v.cards.reduce((s, c) => s + c.count, 0) === 60, (v) => ({
      message: `snapshot ${v.id} must total 60 cards, got ${v.cards.reduce((s, c) => s + c.count, 0)}`,
    })),
});

export const collections = { deck };
