# GeonicDB サンプル: 公共施設マップ

**ライブデモ**: https://geolonia.github.io/geonicdb-sample-public-facility/

[@geolonia/geonicdb-sdk](https://www.npmjs.com/package/@geolonia/geonicdb-sdk) と [Geolonia Maps](https://geolonia.com/) を使って、公共施設のオープンデータを地図上に可視化するサンプルアプリケーションです。

GeonicDB（NGSI-LD 対応 Context Broker）に登録した公共施設エンティティを取得し、リスト表示と地図ピン表示を組み合わせた UI を提供します。

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

より詳しい解説（匿名 read で成立する理由・データの入れ方・カスタマイズ観点）は [docs/architecture.md](docs/architecture.md) を参照してください。アプリ内の「このデモについて」リンクからも同じ内容を読めます。

## プロジェクト構成

```text
src/
├── main.tsx                      # エントリポイント
├── App.tsx                       # メインコンポーネント（施設一覧＋地図）
├── App.css                       # スタイル
├── geolonia-embed.d.ts           # @geolonia/embed 型定義オーバーライド
├── components/
│   ├── map/
│   │   ├── GeonicDbMap.tsx       # Geolonia Maps ラッパー
│   │   └── FacilityMapView.tsx   # 施設ピン地図ビュー
│   └── public-facility/
│       ├── FacilityCard.tsx      # 施設カード
│       ├── FacilityList.tsx      # 施設一覧
│       ├── FacilityDetail.tsx    # 施設詳細パネル
│       └── SpriteIcon.tsx        # スプライトアイコン
├── hooks/
│   └── useFacilities.ts          # GeonicDB から施設データ取得（SDK georel）
├── lib/
│   ├── ngsi.ts                   # NGSIv2 API ユーティリティ
│   └── geo-types.ts              # 地理型定義
└── types/
    └── public-facility.ts        # 公共施設エンティティ型
```

## ビルド

```bash
npm run build
```

`dist/` に静的ファイルが出力されます。

## テスト

```bash
npm test
```

## プレイブック

W2/W3 用の切り出し手順・トラブルシューティングは [docs/playbook.md](docs/playbook.md) を参照してください。

## このデモ専用機能の削除方法

「このデモについて」解説ページ（`src/components/about/`）はこのサンプル専用の機能です。フォークして自団体向けに仕立てる際は不要であれば削除してください。

1. `src/components/about/` ディレクトリを削除する。
2. `src/App.tsx` から `AboutPage` の import・`view` state・`view === 'about'` の分岐・「このデモについて」ボタンを削除する（`// DEMO-ONLY` / `/* DEMO-ONLY START */` 〜 `/* DEMO-ONLY END */` コメントで挟まれた箇所。`grep -rn "DEMO-ONLY" src/` で一覧できる）。
3. （任意）`docs/architecture.md` を削除する。

## ライセンス

MIT
