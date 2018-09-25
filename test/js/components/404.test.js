import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import FourOhFour from 'components/404';

describe('<404 />', () => {
  test('renders msg with link', () => {
    const { getByText } = render(
      <MemoryRouter>
        <FourOhFour />
      </MemoryRouter>,
    );

    expect(getByText('home page')).toBeVisible();
  });

  test('renders with custom children', () => {
    const { getByText } = render(
      <FourOhFour>
        <p>This is custom</p>
      </FourOhFour>,
    );

    expect(getByText('This is custom')).toBeVisible();
  });
});
