import React from 'react';
import { render } from '@testing-library/react';

import ProductIcon from 'components/products/icon';

describe('<ProductIcon />', () => {
  const setup = item => {
    const { getByAltText } = render(<ProductIcon item={item} />);
    return { getByAltText };
  };

  test('renders custom icon', () => {
    const item = {
      id: 'p1',
      title: 'Product 1',
      description: 'This is a test product.',
      category: 'salesforce',
      icon: {
        type: 'url',
        url: 'http://foo.bar',
      },
    };
    const { getByAltText } = setup(item);
    const icon = getByAltText('Product 1');

    expect(icon).toBeVisible();
    expect(icon).toHaveAttribute('src', 'http://foo.bar');
  });
});
