/**
 * Unit tests for seed-lib.ts
 * Tests CSV parsing and NGSI-v2 entity conversion without I/O
 */

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseCSVLine, parseCSV, classifyFacilityType, toBooleanValue, convertRowToEntity } from '../seed-lib';

describe('parseCSVLine', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields containing commas', () => {
    expect(parseCSVLine('"foo,bar",baz')).toEqual(['foo,bar', 'baz']);
  });

  it('handles escaped double quotes inside quoted fields', () => {
    expect(parseCSVLine('"foo""bar",baz')).toEqual(['foo"bar', 'baz']);
  });

  it('trims whitespace around unquoted fields', () => {
    expect(parseCSVLine(' a , b ')).toEqual(['a', 'b']);
  });

  it('returns empty string for empty fields', () => {
    expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c']);
  });
});

describe('parseCSV', () => {
  it('parses header + data rows', () => {
    const csv = '名称,ID\n板橋区役所,001\n赤塚図書館,002';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ 名称: '板橋区役所', ID: '001' });
    expect(rows[1]).toEqual({ 名称: '赤塚図書館', ID: '002' });
  });

  it('strips BOM from the beginning', () => {
    const csv = '﻿名称,ID\n板橋区役所,001';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]['名称']).toBe('板橋区役所');
  });

  it('ignores empty lines', () => {
    const csv = '名称,ID\n板橋区役所,001\n\n';
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(1);
  });

  it('returns empty array when content has only a header', () => {
    expect(parseCSV('名称,ID')).toHaveLength(0);
  });
});

describe('classifyFacilityType', () => {
  it('classifies 図書館 as 図書館', () => {
    expect(classifyFacilityType('赤塚図書館')).toBe('図書館');
  });

  it('classifies 体育館 as 体育館', () => {
    expect(classifyFacilityType('板橋体育館')).toBe('体育館');
  });

  it('classifies 保育園 as 子育て施設', () => {
    expect(classifyFacilityType('板橋保育園')).toBe('子育て施設');
  });

  it('classifies 区民事務所 as 区民事務所', () => {
    expect(classifyFacilityType('高島平区民事務所')).toBe('区民事務所');
  });

  it('returns その他 for unknown names', () => {
    expect(classifyFacilityType('謎の施設')).toBe('その他');
  });
});

describe('toBooleanValue', () => {
  it('returns true for ○', () => expect(toBooleanValue('○')).toBe(true));
  it('returns true for 1', () => expect(toBooleanValue('1')).toBe(true));
  it('returns true for 有', () => expect(toBooleanValue('有')).toBe(true));
  it('returns false for empty string', () => expect(toBooleanValue('')).toBe(false));
  it('returns false for 無', () => expect(toBooleanValue('無')).toBe(false));
});

describe('convertRowToEntity', () => {
  const baseRow = {
    ID: '131199000001',
    地方公共団体名: '板橋区',
    名称: '板橋区役所',
    緯度: '35.751126',
    経度: '139.709251',
    所在地_連結表記: '東京都板橋区板橋2-66-1',
    電話番号: '(03)3964-1111',
    郵便番号: '1738501',
  };

  it('creates a valid NGSI-v2 entity', () => {
    const entity = convertRowToEntity(baseRow, 0);
    expect(entity).not.toBeNull();
    expect(entity!.id).toBe('PublicFacility:itabashi:131199000001');
    expect(entity!.type).toBe('PublicFacility');
  });

  it('sets location from 緯度/経度', () => {
    const entity = convertRowToEntity(baseRow, 0);
    expect(entity!.location).toEqual({
      type: 'geo:json',
      value: { type: 'Point', coordinates: [139.709251, 35.751126] },
    });
  });

  it('sets name attribute', () => {
    const entity = convertRowToEntity(baseRow, 0);
    expect(entity!.name).toEqual({ type: 'Text', value: '板橋区役所' });
  });

  it('sets address from 所在地_連結表記', () => {
    const entity = convertRowToEntity(baseRow, 0);
    expect(entity!.address).toEqual({ type: 'Text', value: '東京都板橋区板橋2-66-1' });
  });

  it('returns null if 名称 is missing', () => {
    const row = { ...baseRow, 名称: '', 緯度: '35.0', 経度: '139.0' };
    expect(convertRowToEntity(row, 0)).toBeNull();
  });

  it('returns null if latitude is missing', () => {
    const row = { ...baseRow, 緯度: '' };
    expect(convertRowToEntity(row, 0)).toBeNull();
  });

  it('returns null if longitude is missing', () => {
    const row = { ...baseRow, 経度: '' };
    expect(convertRowToEntity(row, 0)).toBeNull();
  });

  it('uses row index as ID fallback when ID field is empty', () => {
    const row = { ...baseRow, ID: '' };
    const entity = convertRowToEntity(row, 5);
    expect(entity!.id).toBe('PublicFacility:itabashi:6');
  });

  it('sets wheelchair boolean attribute when present', () => {
    const row = { ...baseRow, 車椅子可: '○' };
    const entity = convertRowToEntity(row, 0);
    expect(entity!.wheelchair).toEqual({ type: 'Boolean', value: true });
  });

  it('omits optional attributes when empty', () => {
    const entity = convertRowToEntity(baseRow, 0);
    expect(entity!.wheelchair).toBeUndefined();
    expect(entity!.openDays).toBeUndefined();
  });
});
