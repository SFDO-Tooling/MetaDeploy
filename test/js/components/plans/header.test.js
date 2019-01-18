import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from 'react-testing-library';

import Header from 'components/plans/header';

describe('<Header />', () => {
  const setup = options => {
    const { getByText } = render(
      <MemoryRouter>
        <Header
          product={{ slug: 'test-product', title: 'Test Product' }}
          version={{ label: 'v0.1.0' }}
          plan={{ title: 'Test Plan' }}
          navRight={null}
          userLoggedIn={options.userLoggedIn}
          preflightStatus={options.preflightStatus}
        />
      </MemoryRouter>,
    );
    return { getByText };
  };

  describe('activeStep', () => {
    test('with user but no preflight, activeStep = 1', () => {
      const { getByText } = setup({
        userLoggedIn: true,
        preflightStatus: null,
      });

      expect(getByText("You've started the preflight check.")).toBeVisible();
    });
  });
});
