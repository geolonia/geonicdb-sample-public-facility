/**
 * seed-lib.ts — 板橋区公共施設 CSV → NGSI-v2 エンティティ変換ライブラリ
 *
 * データ出典: 板橋区 公共施設一覧 (デジタル庁 自治体標準オープンデータセット)
 * URL: https://catalog.data.go.jp/dataset/itabashi-public-facilities
 * ライセンス: CC BY 4.0
 */

// ─── Types ──────────────────────────────────────────────────

export interface NgsiAttribute {
  type: string;
  value: unknown;
}

export interface NgsiEntity {
  id: string;
  type: string;
  [key: string]: NgsiAttribute | string;
}

// ─── CSV Parser ─────────────────────────────────────────────

/** Parse a single CSV line, handling quoted fields and embedded commas */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse a UTF-8 CSV string (with optional BOM) into an array of row objects.
 * Returns an empty array if the content has fewer than 2 lines.
 */
export function parseCSV(content: string): Record<string, string>[] {
  const clean = content.replace(/^\uFEFF/, '');
  const lines = clean.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

// ─── Facility Type Classification ───────────────────────────

const FACILITY_TYPE_KEYWORDS: [string, string][] = [
  ['図書館', '図書館'],
  ['体育館', '体育館'],
  ['公民館', '公民館'],
  ['区民事務所', '区民事務所'],
  ['出張所', '区民事務所'],
  ['児童館', '児童館'],
  ['集会所', '集会所'],
  ['区民集会室', '集会所'],
  ['福祉園', '福祉施設'],
  ['福祉事務所', '福祉施設'],
  ['福祉センター', '福祉施設'],
  ['高齢者', '福祉施設'],
  ['おとしより', '福祉施設'],
  ['障がい', '福祉施設'],
  ['保育園', '子育て施設'],
  ['保育所', '子育て施設'],
  ['子ども', '子育て施設'],
  ['幼稚園', '子育て施設'],
  ['ホール', 'ホール'],
  ['文化会館', 'ホール'],
  ['会館', 'ホール'],
  ['学校', '学校'],
  ['小学校', '学校'],
  ['中学校', '学校'],
  ['公園', '公園'],
  ['スポーツ', '体育館'],
  ['プール', '体育館'],
  ['区役所', '区民事務所'],
  ['健康', '福祉施設'],
  ['センター', 'その他'],
];

export function classifyFacilityType(name: string): string {
  for (const [keyword, type] of FACILITY_TYPE_KEYWORDS) {
    if (name.includes(keyword)) return type;
  }
  return 'その他';
}

// ─── Boolean Helper ─────────────────────────────────────────

export function toBooleanValue(value: string): boolean {
  if (!value) return false;
  const v = value.trim();
  return v === '○' || v === '1' || v === 'true' || v === '有';
}

// ─── Entity Conversion ──────────────────────────────────────

function textAttr(value: string): NgsiAttribute {
  return { type: 'Text', value };
}

function boolAttr(value: boolean): NgsiAttribute {
  return { type: 'Boolean', value };
}

/**
 * Convert a CSV row to an NGSI-v2 PublicFacility entity.
 * Returns null if required fields (名称, 緯度, 経度) are missing or invalid.
 */
export function convertRowToEntity(
  row: Record<string, string>,
  index: number,
): NgsiEntity | null {
  const lat = parseFloat(row['緯度'] ?? '');
  const lng = parseFloat(row['経度'] ?? '');
  if (isNaN(lat) || isNaN(lng)) return null;

  const name = row['名称'] ?? '';
  if (!name) return null;

  const id = row['ID'] || String(index + 1);
  const facilityType = classifyFacilityType(name);

  const entity: NgsiEntity = {
    id: `PublicFacility:itabashi:${id}`,
    type: 'PublicFacility',
    name: textAttr(name),
    location: {
      type: 'geo:json',
      value: { type: 'Point', coordinates: [lng, lat] },
    },
    address: textAttr(row['所在地_連結表記'] ?? ''),
    phone: textAttr(row['電話番号'] ?? ''),
    facilityType: textAttr(facilityType),
    municipality: textAttr(row['地方公共団体名'] ?? '板橋区'),
  };

  // Optional text fields — only add when present in CSV
  const optionalText: [string, string][] = [
    ['名称_カナ', 'nameKana'],
    ['利用可能曜日', 'openDays'],
    ['開始時間', 'openTime'],
    ['終了時間', 'closeTime'],
    ['利用可能時間特記事項', 'openTimeNote'],
    ['説明', 'description'],
    ['URL', 'websiteUrl'],
    ['郵便番号', 'postalCode'],
  ];
  for (const [csvKey, attrKey] of optionalText) {
    const val = row[csvKey];
    if (val) entity[attrKey] = textAttr(val);
  }

  // Optional boolean fields — only add when present in CSV
  const optionalBool: [string, string][] = [
    ['車椅子可', 'wheelchair'],
    ['バリアフリートイレ', 'accessibleToilet'],
    ['点字や読上による支援', 'braille'],
    ['盲導犬・介助犬、聴導犬同伴', 'guideDog'],
    ['授乳室', 'nursingRoom'],
    ['おむつ替えコーナー', 'diaperChanging'],
    ['車椅子貸出', 'wheelchairRental'],
    ['スロープ、エレベータ、エスカレータ', 'slopeElevator'],
    ['優先駐車場', 'priorityParking'],
    ['オストメイト対応トイレ', 'ostomyToilet'],
  ];
  for (const [csvKey, attrKey] of optionalBool) {
    const val = row[csvKey];
    if (val) entity[attrKey] = boolAttr(toBooleanValue(val));
  }

  return entity;
}

/**
 * Parse CSV content and convert all rows to NGSI-v2 entities.
 * Rows with invalid/missing required fields are silently skipped.
 */
export function csvToEntities(csvContent: string): NgsiEntity[] {
  const rows = parseCSV(csvContent);
  const entities: NgsiEntity[] = [];
  for (let i = 0; i < rows.length; i++) {
    const entity = convertRowToEntity(rows[i], i);
    if (entity) entities.push(entity);
  }
  return entities;
}
