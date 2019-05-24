import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderWithRedux } from './../utils';

import FourOhFour from 'components/404';

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
