import React from 'react';
import { render, fireEvent } from 'react-testing-library';

import Login from 'components/header/login';

describe('<Login />', () => {
  test('updates `window.location.href` on login click', () => {
    const { getByText } = render(<Login />);
    window.location.assign = jest.fn();
    fireEvent.click(getByText('Log In'));
    fireEvent.click(getByText('Sandbox or Scratch Org'));
    const expected = window.api_urls.salesforce_test_login();

    expect(window.location.assign).toHaveBeenCalledWith(expected);
  });

  describe('URLs not found', () => {
    let URLS;

    beforeAll(() => {
      URLS = window.api_urls;
      window.api_urls = {};
    });

    afterAll(() => {
      window.api_urls = URLS;
    });

    test('logs error to console', () => {
      render(<Login />);

      expect(window.console.error).toHaveBeenCalled();
    });
  });
});
