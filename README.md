# GeonicDB サンプル: 公共施設マップ

[@geolonia/geonicdb-sdk](https://www.npmjs.com/package/@geolonia/geonicdb-sdk) と [Geolonia Maps](https://geolonia.com/) を使って、公共施設のオープンデータを地図上に可視化するサンプルアプリケーションです。

> **Walking skeleton 段階**: 現在は `geonicdb-app-template` ベースの骨格のみです。
> 公共施設コンポーネント（FacilityCard / FacilityList / MapView 等）と SDK 配線は後続 PR で追加されます。

## セットアップ

```bash
npm install
cp .env.example .env.local   # 環境変数を設定
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

## 環境変数

`.env.example` を参考に `.env.local` を作成してください。

| 変数名 | 説明 |
|---|---|
| `VITE_GEONICDB_URL` | GeonicDB エンドポイント URL |
| `VITE_GEOLONIA_API_KEY` | Geolonia Maps API キー（`YOUR-API-KEY` を自分のキーに置き換えてください） |

Geolonia Maps の API キーは [Geolonia Dashboard](https://geolonia.com/) から取得してください。

### 環境変数ファイルの使い分け

| ファイル | 用途 | git 管理 |
|---|---|---|
| `.env.example` | キー一覧テンプレート（値なし） | 追跡あり |
| `.env.local` | ローカル開発用オーバーライド | 追跡なし |
| `.env.production` | 本番ビルド用 | 追跡なし |

## アーキテクチャ

```text
ブラウザ → localhost:5173 (Vite)
  ├── API リクエスト → VITE_GEONICDB_URL (GeonicDB エンドポイント)
  └── 地図タイル → Geolonia Maps (VITE_GEOLONIA_API_KEY)
```

## プロジェクト構成

```text
src/
├── main.tsx          # エントリポイント
├── App.tsx           # メインコンポーネント
├── App.css           # スタイル
└── lib/
    └── ngsi.ts       # NGSIv2 API クライアントユーティリティ
```

## ビルド

```bash
npm run build
```

`dist/` に静的ファイルが出力されます。

## プレイブック

> この section は walking skeleton 完成後に反復手順を記録します。

- [ ] 公共施設コンポーネントの vendor 手順
- [ ] SDK geo クエリの実機実証手順
- [ ] CI / デプロイ手順

## ライセンス

MIT
