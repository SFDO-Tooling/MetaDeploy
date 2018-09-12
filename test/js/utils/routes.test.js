import routes from 'utils/routes';

describe('routes', () => {
  describe('product_detail', () => {
    test('returns path (with id)', () => {
      const expected = '/products/1';
      const actual = routes.product_detail(1);

      expect(expected).toBe(actual);
    });

    test('returns default path (no id)', () => {
      const expected = '/products/:id';
      const actual = routes.product_detail();

      expect(expected).toBe(actual);
    });
  });
});
