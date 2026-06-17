# ptcgai-deck

Kaggle「[pokemon-tcg-ai-battle](https://www.kaggle.com/competitions/pokemon-tcg-ai-battle)」に投入中の AI エージェント **ptcgai** の現行デッキを、ポケカがわかる人向けに紹介する静的サイト。更新履歴つき。

🔗 https://satory074.github.io/ptcgai-deck/

Astro 5 + Tailwind v4 + GitHub Pages（他の `satory074.github.io/*` サイトと同じ構成）。

```bash
npm install
npm run dev        # http://localhost:4321/ptcgai-deck/
npm run build      # dist/ に静的出力（content collection の Zod で「合計60枚」を検証）
npm run typecheck  # astro check
```

## データ

- **唯一の真実は `src/data/deck.json`**（`meta` / `ladder` / `current`（60枚のカードリスト）/ `history`（変更履歴））。
- `current.cards` は **private な `ptcgai` リポジトリの生成器が出力**したもの。`src/content.config.ts` の Zod `.refine()` が合計60枚をビルド時に強制する。
- 編集の流儀：`ptcgai` 側で `deck.csv` を変更 → `tools/build_deck_display.py` を再実行 → 出力された `deck.json` と `public/og-default.png` をこのリポジトリへコピー → push（GitHub Actions が deploy）。ナラティブ（アーキタイプ名・採用理由・変更履歴）は生成器内の定数で管理。

## ⚠️ コンプライアンス

このリポジトリは**公開**。Kaggle の **Competition Data**（`EN_Card_Data.csv` / `card_table.json`）は *Competition Use 限定*で公開禁止のため、**ここには絶対に置かない**（`.gitignore` でも二重に弾いている）。本サイトが持つのは「カード名・枚数・タイプ・このデッキ分の公開ステータス」だけで、これは一般的なデッキリストと同等の公開情報。OG 画像もカード画像を使わないタイポグラフィのみ。
