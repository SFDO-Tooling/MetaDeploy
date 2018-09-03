import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux } from './../../utils';

import Login from 'components/header/login';

describe('<Login />', () => {
  test('updates `window.location.href` on login click', () => {
    const initialState = { user: null };
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
      initialState,
    );
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
      const initialState = { user: null };
      renderWithRedux(
        <MemoryRouter>
          <Login />
        </MemoryRouter>,
        initialState,
      );

      expect(window.console.error).toHaveBeenCalled();
    });
  });
});
