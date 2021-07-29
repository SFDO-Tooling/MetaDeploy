import React from 'react';

import Footer from '@/js/components/footer';

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
  });
});
