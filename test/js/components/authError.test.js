import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import AuthError from 'components/authError';

describe('<AuthError />', () => {
  test('renders msg with link', () => {
    const { getByText } = render(
      <MemoryRouter>
        <AuthError />
      </MemoryRouter>,
    );
    expect(getByText('¯\\_(ツ)_/¯')).toBeVisible();
  });
});
