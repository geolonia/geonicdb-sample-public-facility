#!/usr/bin/env node
/**
 * seed.ts — 板橋区公共施設データ投入スクリプト
 *
 * データ出典: 板橋区 公共施設一覧 (デジタル庁 自治体標準オープンデータセット)
 * URL: https://catalog.data.go.jp/dataset/itabashi-public-facilities
 * ライセンス: CC BY 4.0
 *
 * 使い方:
 *   cp .env.example .env.local
 *   # .env.local を編集して GEONICDB_SEED_* 変数を設定
 *   npm run seed
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { csvToEntities, type NgsiEntity } from './seed-lib.js';

// ─── Load .env.local ────────────────────────────────────────

const __dir = dirname(fileURLToPath(import.meta.url));

function loadDotEnv(filePath: string): void {
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return; // file not found — silently skip
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

// Load .env.local from repo root (one level up from scripts/)
loadDotEnv(resolve(__dir, '..', '.env.local'));

// ─── Config ─────────────────────────────────────────────────

const GEONICDB_URL = process.env['GEONICDB_SEED_URL'] ?? 'http://localhost:3001';
const TENANT = process.env['GEONICDB_SEED_TENANT'] ?? 'demo';
const TOKEN = process.env['GEONICDB_SEED_TOKEN'] ?? '';

const CSV_PATH = resolve(__dir, 'data', 'itabashi-public-facilities.csv');

// ─── API Helpers ─────────────────────────────────────────────

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Fiware-Service': TENANT,
    'Fiware-ServicePath': '/publicfacility',
  };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  return headers;
}

let created = 0;
let skipped = 0;
let errors = 0;

async function createEntity(entity: NgsiEntity): Promise<void> {
  try {
    const res = await fetch(`${GEONICDB_URL}/v2/entities`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(entity),
    });
    if (res.status === 201) {
      created++;
    } else if (res.status === 409) {
      skipped++;
    } else {
      const body = await res.text();
      console.error(`  Error ${res.status} creating ${entity.id}: ${body}`);
      errors++;
    }
  } catch (err) {
    console.error(`  Network error creating ${entity.id}: ${err}`);
    errors++;
  }
}

async function batchCreate(entities: NgsiEntity[]): Promise<void> {
  const BATCH_SIZE = 50;
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entities.length / BATCH_SIZE);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} entities)... `);

    try {
      const res = await fetch(`${GEONICDB_URL}/v2/op/update`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ actionType: 'append', entities: batch }),
      });
      if (res.status === 204 || res.status === 200) {
        created += batch.length;
        console.log('OK');
      } else {
        console.log(`batch failed (${res.status}), falling back to individual...`);
        for (const entity of batch) await createEntity(entity);
      }
    } catch {
      console.log('network error, falling back to individual...');
      for (const entity of batch) await createEntity(entity);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n板橋区 公共施設データ投入スクリプト');
  console.log(`GeonicDB: ${GEONICDB_URL}  テナント: ${TENANT}`);
  console.log('='.repeat(55));

  // Verify GeonicDB is reachable
  try {
    const res = await fetch(`${GEONICDB_URL}/version`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    console.log('✓ GeonicDB に接続できました\n');
  } catch {
    console.error(`✗ GeonicDB に接続できません: ${GEONICDB_URL}`);
    console.error('  .env.local の GEONICDB_SEED_URL を確認してください');
    process.exit(1);
  }

  // Load bundled CSV
  let csvContent: string;
  try {
    csvContent = readFileSync(CSV_PATH, 'utf-8');
    console.log(`CSV ファイルを読み込みました: ${CSV_PATH}`);
  } catch {
    console.error(`✗ CSV ファイルが見つかりません: ${CSV_PATH}`);
    process.exit(1);
  }

  // Parse and convert
  const entities = csvToEntities(csvContent);
  console.log(`\n${entities.length} 件の施設データを変換しました`);

  // Facility type breakdown
  const typeCount: Record<string, number> = {};
  for (const e of entities) {
    const t = (e['facilityType'] as { value: string }).value;
    typeCount[t] = (typeCount[t] ?? 0) + 1;
  }
  console.log('\n施設種別:');
  for (const [t, c] of Object.entries(typeCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c} 件`);
  }

  // Insert
  console.log('\nデータ投入中...');
  await batchCreate(entities);

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('投入完了!');
  console.log(`  作成: ${created} 件 / スキップ(既存): ${skipped} 件 / エラー: ${errors} 件`);
  console.log('\nデータ出典: 板橋区オープンデータ (CC BY 4.0)');
  console.log('https://catalog.data.go.jp/dataset/itabashi-public-facilities');

  if (errors > 0) {
    console.error(`\n  ⚠ ${errors} 件のエラーが発生しました`);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
