import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../src/domain/defaults';
import { setJournal, setTaskStatus } from '../src/domain/records';
import { adjustWater } from '../src/domain/water';
import { parseAppData } from '../src/storage/schema';
import { loadData, parseBackup, saveData, serializeBackup, STORAGE_KEY, type KeyValueStore } from '../src/storage/storage';

const TODAY = '2026-10-24';

class MemoryStore implements KeyValueStore {
  map = new Map<string, string>();
  failWith: DOMException | null = null;
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.failWith) throw this.failWith;
    this.map.set(key, value);
  }
}

function sampleData() {
  const data = createDefaultData(TODAY);
  setTaskStatus(data, TODAY, 't-exercise', 'done');
  adjustWater(data, TODAY, 'c-bottle-small', 1);
  setJournal(data, TODAY, 'سپاسگزارم <script>alert(1)</script>');
  return data;
}

describe('persistence', () => {
  it('first launch creates defaults', () => {
    const r = loadData(new MemoryStore(), TODAY);
    expect(r.fresh).toBe(true);
    expect(r.data.firstUse).toBe(TODAY);
  });

  it('save → load round-trips exactly', () => {
    const store = new MemoryStore();
    const data = sampleData();
    expect(saveData(store, data)).toEqual({ ok: true });
    const r = loadData(store, '2027-01-01');
    expect(r.fresh).toBe(false);
    expect(r.data).toEqual(data);
  });

  it('corrupted data is kept aside, never silently lost', () => {
    const store = new MemoryStore();
    store.map.set(STORAGE_KEY, '{"schemaVersion":1,"broken":');
    const r = loadData(store, TODAY);
    expect(r.recovered).toBe(true);
    const aside = [...store.map.keys()].filter((k) => k.startsWith('maktab.habit.corrupt.'));
    expect(aside).toHaveLength(1);
  });

  it('reports quota errors instead of throwing', () => {
    const store = new MemoryStore();
    store.failWith = new DOMException('full', 'QuotaExceededError');
    expect(saveData(store, sampleData())).toEqual({ ok: false, reason: 'quota' });
  });

  it('rejects structurally invalid data', () => {
    const bad = JSON.parse(JSON.stringify(sampleData()));
    bad.days[TODAY].tasks['t-exercise'] = 'maybe';
    expect(() => parseAppData(bad)).toThrow();
    const bad2 = JSON.parse(JSON.stringify(sampleData()));
    bad2.days['2026-02-31'] = { tasks: {}, water: {}, journal: '' };
    expect(() => parseAppData(bad2)).toThrow();
    const bad3 = JSON.parse(JSON.stringify(sampleData()));
    bad3.tasks.push({ ...bad3.tasks[0] });
    expect(() => parseAppData(bad3)).toThrow(/duplicate/);
  });
});

describe('backup', () => {
  it('export → import round-trips', () => {
    const data = sampleData();
    const r = parseBackup(serializeBackup(data, new Date('2026-10-24T10:00:00Z')));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual(data);
      expect(r.exportedAt).toBe('2026-10-24T10:00:00.000Z');
    }
  });

  it('rejects foreign or broken files with a Persian message', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'این فایل، فایل پشتیبان معتبر نیست.' });
    expect(parseBackup('{"app":"other"}').ok).toBe(false);
    expect(parseBackup('{"app":"maktab-habit","schemaVersion":1,"data":{}}').ok).toBe(false);
  });
});

describe('storage budget', () => {
  it('six months of heavy use stays well under 1 MB', () => {
    const data = createDefaultData(TODAY);
    let day = TODAY;
    for (let i = 0; i < 183; i += 1) {
      for (const t of data.tasks) setTaskStatus(data, day, t.id, 'partial');
      for (let k = 0; k < 8; k += 1) adjustWater(data, day, 'c-cooler-cup', 1);
      setJournal(data, day, 'ا'.repeat(1500));
      const d = new Date(`${day}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      day = d.toISOString().slice(0, 10);
    }
    const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
    expect(bytes).toBeLessThan(1_000_000);
  });
});
