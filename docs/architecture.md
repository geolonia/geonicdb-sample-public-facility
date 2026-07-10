# システム構成解説

このサンプルアプリがどのように動いているかを解説します。フォーク後に自団体データへ差し替える際の理解の助けとしてください。

## ① 全体構成

```text
[Browser SPA（GitHub Pages / Netlify などの静的ホスティング）]
  ├─ @geolonia/geonicdb-sdk の NgsiV2Client
  │     ──（匿名 GET /v2/entities, Fiware-Service: <VITE_GEONICDB_TENANT>）──▶
  │     GeonicDB（VITE_GEONICDB_URL で指定したテナント）
  └─ @geolonia/embed（Geolonia Maps）
        ──（地図タイル, VITE_GEOLONIA_API_KEY）──▶
        Geolonia

[データ投入（seed・一度きり／更新時）]
板橋区 公共施設データ CSV（CC BY 4.0・scripts/data/ に同梱）
  ─▶ scripts/seed.ts（CSV → NGSI-v2 エンティティ変換）
  ─▶ POST /v2/entities（GEONICDB_SEED_URL で指定した自分の GeonicDB）
```

フロントエンドは `src/hooks/useFacilities.ts` が `NgsiV2Client.getEntities({ type: 'PublicFacility', limit: 1000 })` を呼び出し、取得したエンティティを `src/components/public-facility/FacilityList.tsx` と `src/components/map/FacilityMapView.tsx` に渡すだけの単純な構成です。バックエンドの独自実装はありません。

## ② なぜ匿名 read で成立するか（XACML）

このアプリはログイン機能を持たず、`VITE_GEONICDB_URL` + `VITE_GEONICDB_TENANT` だけで GeonicDB からデータを取得できます。これは GeonicDB 側のテナント設定で、当該テナントの `PublicFacility` エンティティに対して **匿名ユーザーの read アクセスを XACML ポリシーで許可**しているためです。

- 書き込み（POST/PATCH/DELETE）は許可されていません。デモ用の `demo` テナントに対して `npm run seed` を実行しても失敗します。
- 自分の GeonicDB に同様の匿名 read ポリシーを設定すれば、認証なしで同じ構成が動きます。認証が必要な運用にしたい場合は、GeonicDB 側のテナント設定でポリシーを絞ってください（本サンプルのコード変更は不要）。

## ③ データの入れ方

1. `.env.example` を `.env.local` にコピーし、`GEONICDB_SEED_URL` / `GEONICDB_SEED_TENANT` / `GEONICDB_SEED_TOKEN`（必要な場合）を自分の GeonicDB に向けて設定する。
2. `npm run seed` を実行する。`scripts/seed.ts` が `scripts/data/itabashi-public-facilities.csv`（板橋区公共施設一覧・CC BY 4.0）を読み込み、NGSI-v2 の `PublicFacility` エンティティへ変換して投入する。
3. 自団体のデータに差し替える場合は、同じ列構成（デジタル庁 自治体標準オープンデータセットの公共施設一覧フォーマット）の CSV を用意し、`npm run seed -- --csv <path>` のように差し替える。

## ④ 静的ホスティングの利点

フロントエンドは GeonicDB への API 呼び出しと地図タイル取得だけを行う SPA なので、Vite でビルドした `dist/` を GitHub Pages・Netlify・その他の静的ホスティングにそのまま置くだけで動作します。サーバーサイドの実行環境（Node サーバーなど）を自前で維持する必要がありません。

## ⑤ カスタマイズ観点

| 変えたいもの | 変更箇所 |
|---|---|
| 接続先の GeonicDB / テナント | `.env.local` の `VITE_GEONICDB_URL` / `VITE_GEONICDB_TENANT` |
| 地図の API キー | `.env.local` の `VITE_GEOLONIA_API_KEY` |
| 投入するデータ | `scripts/data/` の CSV ＋ `npm run seed` |
| エンティティ取得ロジック | `src/hooks/useFacilities.ts` |
| リスト・地図の表示内容 | `src/components/public-facility/` ・ `src/components/map/` |
| このデモ専用の解説ページ | `src/components/about/`（不要なら削除可。手順は README 参照） |
