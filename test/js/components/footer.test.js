import React from 'react';

import Footer from '@/components/footer';

import { render } from './../utils';

describe('<Footer />', () => {
  describe('wordmark', () => {
    beforeAll(() => {
      window.GLOBALS.SITE = {
        show_metadeploy_wordmark: true,
      };
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    test('renders wordmark', () => {
      const { getByText } = render(<Footer />);
      expect(getByText('meta')).toBeVisible();
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
