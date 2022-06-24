import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import FourOhFour from '@/js/components/404';

import { renderWithRedux } from './../utils';

describe('<404 />', () => {
  test('renders default msg with link', () => {
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <FourOhFour />
      </MemoryRouter>,
    );

    expect(getByText('home page')).toBeVisible();
  });

  test('renders with custom message', () => {
    const { getByText } = renderWithRedux(
      <MemoryRouter>
        <FourOhFour message="This is custom" />
      </MemoryRouter>,
    );

    expect(getByText('This is custom')).toBeVisible();
  });
});
