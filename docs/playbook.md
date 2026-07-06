# GeonicDB サンプルアプリ 切り出しプレイブック

geonicdb-demo-app からコンポーネントを独立サンプルリポに切り出す際の再現手順。
W2/W3 用の作業ガイド（cmd_604/cmd_610 の実装から抽出）。

---

## 1. repo 作成

```bash
# GitHub CLI で空リポを作成
unset GH_TOKEN
gh repo create geolonia/geonicdb-sample-<app> \
  --public \
  --description "<app> のサンプルアプリ" \
  --clone=false
```

Vite + React テンプレートで初期化し、`feat/walking-skeleton` ブランチを切る。

```bash
npm create vite@latest geonicdb-sample-<app> -- --template react-ts
cd geonicdb-sample-<app>
git init && git remote add origin git@github.com:geolonia/geonicdb-sample-<app>.git
git checkout -b feat/walking-skeleton
```

---

## 2. 依存パッケージ追加

### 本番依存

```bash
# @geolonia/geonicdb-sdk@0.14.0 以降を使用（georel/geometry/coords ネイティブサポート）
npm install @geolonia/geonicdb-sdk@0.14.0 @geolonia/embed lucide-react
```

### 開発依存

```bash
npm install -D @types/mapbox-gl vitest jsdom @testing-library/react @testing-library/jest-dom
```

### postinstall パッチ（`@geolonia/embed` 型定義バグ対策）

`package.json` に追加：

```json
"postinstall": "sed -i'' -e 's/geoloniaControl: string:/geoloniaControl: string;/' node_modules/@geolonia/embed/src/embed.d.ts || true"
```

> `@geolonia/embed@1.19.1` の `embed.d.ts:22` に `:` → `;` の構文エラーがある。
> `skipLibCheck: true` では解決できない（パーサエラーのため）。

---

## 3. TypeScript 設定

`tsconfig.json` に `paths` オーバーライドを追加して壊れた embed 型を無効化：

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "paths": {
      "@geolonia/embed": ["./src/geolonia-embed.d.ts"]
    }
  }
}
```

`src/geolonia-embed.d.ts` を新規作成：

```typescript
import type * as mapboxgl from 'mapbox-gl';

declare module '@geolonia/embed' {
  export const Map: typeof mapboxgl.Map;
  export const Marker: typeof mapboxgl.Marker;
  export type MapInstance = mapboxgl.Map;
  export type MarkerInstance = mapboxgl.Marker;
  export const geolonia: any;
  export type EmbedPlugin = (
    map: mapboxgl.Map,
    target: HTMLElement,
    atts: Record<string, string>,
  ) => void;
}
```

---

## 4. コンポーネントベンダリング

demo-app から以下をコピーし、内部依存を書き換える。

| 元パス（demo-app） | 移動先 | 変更点 |
|---|---|---|
| `packages/dashboard/src/types/public-facility.ts` | `src/types/public-facility.ts` | `@geonicdb-demo/shared` → `@geolonia/geonicdb-sdk/ngsi-v2` + `../lib/geo-types` |
| `packages/shared/src/components/GeonicDbMap.tsx` | `src/components/map/GeonicDbMap.tsx` | Map/Marker を GeoloniaMap/GeoloniaMarker にリネーム（built-in `Map` との衝突回避） |
| `packages/dashboard/src/components/public-facility/FacilityMapView.tsx` | `src/components/map/FacilityMapView.tsx` | `useGeonicDbMap, geolonia` を `./GeonicDbMap` から import |
| `packages/dashboard/src/components/public-facility/SpriteIcon.tsx` | `src/components/public-facility/SpriteIcon.tsx` | import パス調整 |
| `packages/dashboard/src/components/public-facility/FacilityCard.tsx` | `src/components/public-facility/FacilityCard.tsx` | `react-i18next` 削除・`t(...)` → ハードコード日本語 |
| `packages/dashboard/src/components/public-facility/FacilityList.tsx` | `src/components/public-facility/FacilityList.tsx` | 同上 |
| `packages/dashboard/src/components/public-facility/FacilityDetail.tsx` | `src/components/public-facility/FacilityDetail.tsx` | 同上 |

### 削除すべき内部依存

- `react-i18next` — `t('key')` をすべてハードコード日本語に置換
- `withDemoMode` HOC — Props を直接受け取るように書き換え
- `app-registry` — 削除
- `@geonicdb-demo/*` モノレポパス — 上記 paths に置換

---

## 5. SDK ワイヤリング（useFacilities フック）

`src/hooks/useFacilities.ts` を新規作成：

```typescript
import { useCallback, useEffect, useState } from 'react';
import { NgsiV2Client } from '@geolonia/geonicdb-sdk/ngsi-v2';
import type { NgsiV2Entity } from '@geolonia/geonicdb-sdk/ngsi-v2';
import { toPublicFacility } from '../types/public-facility';
import type { PublicFacility } from '../types/public-facility';

const BASE_URL = import.meta.env.VITE_GEONICDB_URL || '';

export function useFacilities(type = 'PublicFacility') {
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = new NgsiV2Client({ baseUrl: BASE_URL });
      const entities: NgsiV2Entity[] = await client.listEntities({ type, limit: 1000 });
      setFacilities(entities.map((e) => toPublicFacility(e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '取得エラー');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  return { facilities, loading, error, fetchFacilities };
}
```

> **georel (SDK 0.14.0+)**: `NgsiV2Client.getEntities()` は `georel`/`geometry`/`coords` をネイティブサポートしている。
> `fetch()` でのエスケープハッチは不要。以下のように geo クエリを SDK 経由で実行できる：
>
> ```typescript
> const data = await client.getEntities({
>   type,
>   limit: 100,
>   georel: 'near;maxDistance:1000',
>   geometry: 'point',
>   coords: '35.6,139.7',
> });
> ```
>
> `geometry` の型は `'point' | 'line' | 'polygon' | 'box'`。文字列から変換する場合は `as 'point' | 'line' | 'polygon' | 'box'` でキャストする。
> 型定義の詳細は `node_modules/@geolonia/geonicdb-sdk/ngsi-v2/index.d.ts` の `NgsiV2QueryOptions` を参照。

---

## 6. 地図コンポーネントの既知の罠

### `Map` 命名衝突

```typescript
// NG: TypeScript が built-in Map<K,V> に解決する
import { Map } from '@geolonia/embed';
const ref = useRef<Map | null>(null);

// OK: リネームして衝突を回避
import { Map as GeoloniaMap } from '@geolonia/embed';
import type * as mapboxgl from 'mapbox-gl';
const ref = useRef<mapboxgl.Map | null>(null);
```

### `getSprite` / `addSprite` は `@types/mapbox-gl` に存在しない

MapLibre 固有メソッドなので型アサーションが必要：

```typescript
const anyMap = map as any;
anyMap.addSprite(SPRITE_ID, SPRITE_URL);
```

### `setSpriteReady` の lint エラー（react-hooks/set-state-in-effect）

useEffect 内で同期的に setState すると lint エラーになる：

```typescript
// NG
if (alreadyLoaded) { setSpriteReady(true); return; }

// OK
if (alreadyLoaded) { queueMicrotask(() => setSpriteReady(true)); return; }
```

---

## 7. テスト方針

- テストファーストで書く（実装前に skeleton を作ること）
- 地図コンポーネント（`FacilityMapView`）はテストでモック：

```typescript
vi.mock('./components/map/FacilityMapView', () => ({
  FacilityMapView: () => <div data-testid="facility-map" />,
}));
```

- `useFacilities` もモック（外部 API 依存を排除）：

```typescript
vi.mock('./hooks/useFacilities', () => ({
  useFacilities: () => ({ facilities: [], loading: false, error: null }),
}));
```

- **SKIP = FAIL**: テスト結果に SKIP が 1 件でもあれば未完了

---

## 8. 環境変数と秘密情報

`.env.example`（必ずリポに含める）：

```
VITE_GEONICDB_URL=
VITE_GEOLONIA_API_KEY=YOUR-API-KEY
```

**禁止事項**:
- 実 API キーを `.env` に書いてから `git add` してしまうことを防ぐため `.env` は `.gitignore` に含める
- `VITE_GEOLONIA_API_KEY` の実値を commit / echo / log しない
- `GH_TOKEN` は `gh` コマンド実行前に `unset GH_TOKEN`

---

## チェックリスト（PR 前）

- [ ] `npm test -- --run` → passed ≥1, skipped = 0
- [ ] `npm run build` → SUCCESS（エラーなし）
- [ ] `npm run lint` → errors = 0
- [ ] `.env.example` に `YOUR-API-KEY` のみ（実値なし）
- [ ] main への直接 commit なし（ブランチ → PR）
- [ ] `/code-review-expert --auto` → P0/P1 = 0
