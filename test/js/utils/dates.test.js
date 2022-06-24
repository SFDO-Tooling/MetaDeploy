import { getDuration } from '@/js/utils/dates';

describe('getDuration', () => {
  [
    { input: 'foo', output: null },
    { input: null, output: null },
    { input: '-1', output: null },
    { input: '59.999', output: '59 seconds' },
    { input: '60', output: '1 minute' },
    { input: '3599', output: '1 hour' },
    { input: '84600', output: '23.5 hours' },
    { input: '634176', output: '7.3 days' },
    { input: '31632768', output: '1 year' },
  ].forEach(({ input, output }) => {
    test(`returns formatted duration with input: ${input}`, () => {
      expect(getDuration(input)).toEqual(output);
    });
  });
});
