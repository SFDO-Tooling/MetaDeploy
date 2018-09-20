import routes, { routePatterns } from 'utils/routes';

describe('routes', () => {
  [
    { name: 'product_detail', args: [1], expected: '/products/1' },
    { name: 'version_detail', args: [1, 2], expected: '/products/1/2' },
    { name: 'plan_detail', args: [1, 2, 3], expected: '/products/1/2/3' },
  ].forEach(({ name, args, expected }) => {
    test(`${name} returns path with args: ${args.join(', ')}`, () => {
      expect(routes[name](...args)).toBe(expected);
    });
  });
});

describe('routePatterns', () => {
  [
    { name: 'home', expected: '/' },
    {
      name: 'auth_error',
      expected: '/accounts/salesforce-(custom|production|test)/login/callback',
    },
    { name: 'product_list', expected: '/products' },
    { name: 'product_detail', expected: '/products/:productSlug' },
    {
      name: 'version_detail',
      expected: '/products/:productSlug/:versionLabel',
    },
    {
      name: 'plan_detail',
      expected: '/products/:productSlug/:versionLabel/:planSlug',
    },
  ].forEach(({ name, expected }) => {
    test(`${name} returns path`, () => {
      expect(routePatterns[name]()).toBe(expected);
    });
  });
});
