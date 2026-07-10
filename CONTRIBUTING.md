# コントリビューションガイド

## デザイントークンの再 vendor 手順

`src/styles/tokens.css` は `@geolonia/design-tokens` の `dist/tokens.css` を vendor したものです。

### 更新タイミング

- `@geolonia/design-tokens` の新バージョンリリース時
- 四半期定期（目安）

### 手順

1. `geolonia/geolonia-design-system` を最新化してビルド:
   ```bash
   cd ~/workspace/geolonia-design-system
   git pull origin main
   npm install && npm run build
   ```
2. `packages/design-tokens/dist/tokens.css` を `src/styles/tokens.css` へコピー
3. ファイル先頭のコメント行のバージョンと日付を更新:
   ```
   /* @geolonia/design-tokens vX.Y.Z vendored YYYY-MM-DD — update via: ... */
   ```
4. PR を送る
