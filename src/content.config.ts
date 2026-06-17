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

const deck = defineCollection({
  loader: () => [{ ...data.current }],
  schema: z
    .object({
      id: z.string(),
      label: z.string(),
      date: z.coerce.date(),
      archetype: z.string(),
      rationale: z.string(),
      energyIdentity: z.string(),
      cards: z.array(cardSchema).min(1),
    })
    .refine((v) => v.cards.reduce((s, c) => s + c.count, 0) === 60, (v) => ({
      message: `deck ${v.id} must total 60 cards, got ${v.cards.reduce((s, c) => s + c.count, 0)}`,
    })),
});

export const collections = { deck };
