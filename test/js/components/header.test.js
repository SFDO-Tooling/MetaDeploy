import React from 'react';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux } from './../utils';

import Header from 'components/header';

describe('<Header />', () => {
  describe('logged out', () => {
    test('renders login dropdown', () => {
      const initialState = { user: null };
      const { getByText } = renderWithRedux(<Header />, initialState);
      const btn = getByText('Log In');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Production or Developer Org')).toBeVisible();
      expect(getByText('Sandbox Org')).toBeVisible();
    });

    test('updates `window.location.href` on login click', () => {
      const initialState = { user: null };
      const { getByText } = renderWithRedux(<Header />, initialState);
      window.location.assign = jest.fn();
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Sandbox Org'));

      expect(window.location.assign).toHaveBeenCalled();
    });
  });

  describe('logged in', () => {
    test('renders profile dropdown (with logout)', () => {
      const initialState = { user: { username: 'Test User' } };
      const { container, getByText } = renderWithRedux(
        <Header />,
        initialState,
      );
      const btn = container.querySelector('#logout');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Log Out')).toBeVisible();
    });
  });
});
