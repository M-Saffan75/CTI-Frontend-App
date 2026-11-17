import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { Trans } from 'react-i18next';

import i18n from '@/i18n';
import { setCurrentLanguage } from '@/i18n/locale';

// A sentence with one coloured word must read right in both languages
describe('Trans with a highlighted word', () => {
  afterAll(() => {
    setCurrentLanguage('tr');
    i18n.changeLanguage('tr');
  });

  const text = (node: any): string =>
    typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join('') : node?.children ? text(node.children) : '';

  it('keeps the word order of each language', async () => {
    for (const [code, expected] of [
      ['en', 'Be a part of Solution, not Pollution'],
      ['tr', 'Kirliliğin değil, Çözümün bir parçası olun'],
    ] as const) {
      setCurrentLanguage(code);
      await i18n.changeLanguage(code);
      let tree: any;
      await act(async () => {
        tree = renderer.create(
          <Text>
            <Trans i18nKey="customerMsg.aboutSolution" components={{ hl: <Text style={{ color: 'red' }} /> }} />
          </Text>,
        );
      });
      expect(text(tree.toJSON())).toBe(expected);
    }
  });
});
