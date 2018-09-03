import KEYS from '@salesforce/design-system-react/utilities/key-code';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux } from './../utils';

import Header from 'components/header';

describe('<Header />', () => {
  describe('logged out', () => {
    test('renders login dropdown', () => {
      const initialState = { user: null };
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
        initialState,
      );
      const btn = getByText('Log In');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Production or Developer Org')).toBeVisible();
      expect(getByText('Sandbox or Scratch Org')).toBeVisible();
    });

    test('updates `window.location.href` on login click', () => {
      const initialState = { user: null };
      const { getByText } = renderWithRedux(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
        initialState,
      );
      window.location.assign = jest.fn();
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Sandbox or Scratch Org'));
      const expected = window.api_urls.salesforce_test_login();

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });
  });

  describe('logged in', () => {
    test('renders profile dropdown (with logout)', () => {
      const initialState = { user: { username: 'Test User' } };
      const { container, getByText } = renderWithRedux(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
        initialState,
      );
      const btn = container.querySelector('#logout');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Log Out')).toBeVisible();
    });
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
          <Header />
        </MemoryRouter>,
        initialState,
      );

      expect(window.console.error).toHaveBeenCalled();
    });
  });

  describe('<CustomDomainForm />', () => {
    const setup = () => {
      const initialState = { user: null };
      const { getByLabelText, getByText, getByTestId } = renderWithRedux(
        <MemoryRouter>
          <Header />
        </MemoryRouter>,
        initialState,
      );
      return { getByLabelText, getByText, getByTestId };
    };

    test('updates label when input changes', () => {
      const { getByLabelText, getByText, getByTestId } = setup();

      fireEvent.click(getByText('Log In'));
      const input = getByLabelText('Use Custom Domain');

      expect(input).toBeVisible();
      expect(getByTestId('custom-domain')).toHaveTextContent('domain');

      fireEvent.change(input, { target: { value: ' ' } });

      expect(getByTestId('custom-domain')).toHaveTextContent('domain');

      fireEvent.change(input, { target: { value: ' foobar' } });

      expect(getByText('https://foobar.my.salesforce.com')).toBeVisible();
    });

    test('updates window.location.href on submit', () => {
      const { getByLabelText, getByText } = setup();

      window.location.assign = jest.fn();
      fireEvent.click(getByText('Log In'));
      const input = getByLabelText('Use Custom Domain');
      fireEvent.change(input, { target: { value: ' ' } });
      fireEvent.click(getByText('Continue'));

      expect(window.location.assign).not.toHaveBeenCalled();

      fireEvent.change(input, { target: { value: 'foobar' } });
      fireEvent.click(getByText('Continue'));
      const baseUrl = window.api_urls.salesforce_custom_login();
      const expected = `${baseUrl}?custom_domain=foobar`;

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });

    test('closes menu on ESC', () => {
      const { getByLabelText, getByText } = setup();

      const login = getByText('Log In');
      fireEvent.click(login);

      expect(login).toHaveAttribute('aria-expanded', 'true');

      fireEvent.keyDown(getByLabelText('Use Custom Domain'), {
        keyCode: KEYS.ESCAPE,
      });

      expect(login).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
