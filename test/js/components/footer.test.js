import React from 'react';
import { render } from 'react-testing-library';

import Footer from 'components/footer';

describe('<Footer />', () => {
  test('renders logo with `backgroundImage` set to `logoSrc`', () => {
    const { getByTestId } = render(<Footer logoSrc="my/logo.png" />);
    expect(getByTestId('footer-logo')).toHaveStyle(
      'background-image: url(my/logo.png)',
    );
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
