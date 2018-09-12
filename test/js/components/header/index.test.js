import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux } from './../../utils';

import Header from 'components/header';

describe('<Header />', () => {
  const setup = (initialState = { user: null }) => {
    const { container, getByLabelText, getByText } = renderWithRedux(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
      initialState,
    );
    return { container, getByLabelText, getByText };
  };

  describe('logged out', () => {
    test('renders login dropdown', () => {
      const { getByText } = setup();
      const btn = getByText('Log In');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Production or Developer Org')).toBeVisible();
      expect(getByText('Sandbox or Scratch Org')).toBeVisible();
    });
  });

  describe('logged in', () => {
    test('renders profile dropdown (with logout)', () => {
      const initialState = { user: { username: 'Test User' } };
      const { container, getByText } = setup(initialState);
      const btn = container.querySelector('#logout');

      expect(btn).toBeVisible();

      fireEvent.click(btn);

      expect(getByText('Log Out')).toBeVisible();
    });
  });
});
