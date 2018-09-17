import routes from 'utils/routes';

describe('routes', () => {
  [
    { name: 'product_detail', args: [1], expected: '/products/1' },
    { name: 'product_detail', args: [], expected: '/products/:productSlug' },
    { name: 'version_detail', args: [1, 2], expected: '/products/1/2' },
    {
      name: 'version_detail',
      args: [],
      expected: '/products/:productSlug/:versionLabel',
    },
    { name: 'plan_detail', args: [1, 2, 3], expected: '/products/1/2/3' },
    {
      name: 'plan_detail',
      args: [],
      expected: '/products/:productSlug/:versionLabel/:planSlug',
    },
  ].forEach(({ name, args, expected }) => {
    test(`${name} returns path with args: ${args.join(', ')}`, () => {
      expect(routes[name](...args)).toBe(expected);
    });
  });
});
