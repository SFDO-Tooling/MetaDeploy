import { render } from '@testing-library/react';
import React from 'react';

import Footer from '@/components/footer';

describe('<Footer />', () => {
  describe('logo', () => {
    beforeAll(() => {
      window.GLOBALS.SITE = {
        product_logo: 'my/logo.png',
      };
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    test('renders logo with `backgroundImage` set to product logo', () => {
      const { getByTestId } = render(<Footer />);
      expect(getByTestId('footer-logo')).toHaveStyle(
        'background-image: url(my/logo.png)',
      );
    });
  });

  test('renders default copyright notice', () => {
    const { getByText } = render(<Footer />);

    expect(getByText('Copyright', { exact: false })).toBeVisible();
  });

  describe('site copyright_notice', () => {
    beforeAll(() => {
      window.GLOBALS.SITE = {
        copyright_notice: 'Are you sure?',
      };
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    test('renders copyright notice', () => {
      const { getByText } = render(<Footer logoSrc="my/logo.png" />);

      expect(getByText('Are you sure?')).toBeVisible();
    });

    test('renders copyright notice with company name', () => {
      window.GLOBALS.SITE.copyright_notice = null;
      window.GLOBALS.SITE.company_name = 'My Company';
      const { getByText } = render(<Footer logoSrc="my/logo.png" />);

      expect(getByText('My Company', { exact: false })).toBeVisible();
    });
  });
});
