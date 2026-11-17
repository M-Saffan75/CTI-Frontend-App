import fs from 'fs';
import path from 'path';

import { lower, setCurrentLanguage, upper } from '@/i18n/locale';
import en from '@/i18n/locales/en';
import tr from '@/i18n/locales/tr';

const SRC = path.join(__dirname, '..', 'src');

function files(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) files(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !full.includes(`${path.sep}locales${path.sep}`)) out.push(full);
  }
  return out;
}

function flatten(obj: any, prefix = '', out: string[] = []): string[] {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, full, out);
    else out.push(full);
  }
  return out;
}

const hasKey = (tree: any, key: string) => {
  let node = tree;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object' || !(part in node)) return false;
    node = node[part];
  }
  return typeof node === 'string';
};

describe('translation keys', () => {
  it('Turkish has exactly the same keys as English', () => {
    expect(flatten(tr).sort()).toEqual(flatten(en).sort());
  });

  it('has no empty text', () => {
    for (const tree of [en, tr]) {
      expect(flatten(tree).filter(key => !String((key.split('.').reduce((n: any, p) => n?.[p], tree as any)) || '').trim())).toEqual([]);
    }
  });

  it('every t(...) key written in the code exists', () => {
    const direct = /\bt\(\s*'([A-Za-z0-9_.]+)'/g;
    const stored = /'((?:settings\.menu|tabs|sellerTabs|dispute|reviewModal|roleSelect|glossary|customerMsg|customer|repairmanMsg|repairman|sellerMsg|sellerAuto|appMsg|chat)\.[A-Za-z0-9_.]+)'/g;
    const trans = /i18nKey="([A-Za-z0-9_.]+)"/g;
    const missing: string[] = [];
    for (const file of files(SRC)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const re of [direct, stored, trans]) {
        re.lastIndex = 0;
        let match;
        while ((match = re.exec(text))) {
          if (!hasKey(en, match[1])) missing.push(`${path.relative(SRC, file)}: ${match[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('Turkish upper and lower case', () => {
  afterAll(() => setCurrentLanguage('tr'));

  it('keeps the dotted and dotless i', () => {
    setCurrentLanguage('tr');
    expect(upper('iade')).toBe('İADE');
    expect(upper('ışık')).toBe('IŞIK');
    expect(lower('İADE')).toBe('iade');
    expect(lower('IŞIK')).toBe('ışık');
  });

  it('English uses the normal rules', () => {
    setCurrentLanguage('en');
    expect(upper('iade')).toBe('IADE');
    expect(lower('IADE')).toBe('iade');
  });
});

describe('ids that the screens turn into keys', () => {
  const need = (group: string, ids: string[]) => {
    const missing = ids.filter(id => !hasKey(en, `${group}.${id}`) || !hasKey(tr, `${group}.${id}`));
    expect(missing).toEqual([]);
  };

  it('has a text for every id', () => {
    need('customerMsg.disputeTab', ['details', 'repairman', 'booking', 'disputes']);
    need('customerMsg.sort', ['default', 'priceAsc', 'priceDesc', 'rated', 'newest']);
    need('repairmanMsg.earnTab', ['overview', 'withdraw', 'history']);
    need('common.weekdays', ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']);
    need('theme', ['white', 'black', 'sand']);
    need('repairmanMsg.svcType', ['home', 'shop', 'pickup']);
    need('sellerMsg.kyc', ['pending', 'approved', 'rejected', 'revision']);
    need('repairmanMsg.jobHint', ['confirmed', 'repairman_notified', 'scheduled', 'in_progress', 'parts_needed', 'quality_check', 'completed', 'delivered', 'cancelled', 'disputed', 'closed']);
    need('customerMsg.status', ['pending', 'processing', 'shipping', 'shipped', 'delivered', 'cancelled', 'confirmed', 'open', 'booked', 'scheduled', 'in_progress', 'completed', 'disputed', 'accepted', 'rejected', 'expired', 'under_review', 'requested', 'approved']);
    need('customerMsg.unit', ['hours', 'days', 'weeks', 'minutes']);
  });
});

describe('placeholders', () => {
  const vars = (text: string) => (text.match(/\{\{\s*\w+\s*\}\}/g) || []).map(v => v.replace(/\s/g, '')).sort();
  const valueOf = (tree: any, key: string) => key.split('.').reduce((node: any, part) => node?.[part], tree) as string;

  it('Turkish uses the same placeholders as English', () => {
    const wrong = flatten(en).filter(key => vars(valueOf(en, key)).join() !== vars(valueOf(tr, key)).join());
    expect(wrong).toEqual([]);
  });
});
