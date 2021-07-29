import { fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import Header from '@/js/components/header';

import { renderWithRedux } from './../../utils';

describe('<Header />', () => {
  const setup = (state, props) => {
    const defaultState = { user: null, socket: false, org: null, errors: [] };
    const initialState = { ...defaultState, ...state };
    const initialProps = props || {};
    const { container, getByLabelText, getByText, getByAltText, queryByText } =
      renderWithRedux(
        <MemoryRouter>
          <Header {...initialProps} />
        </MemoryRouter>,
        initialState,
      );
    return { container, getByLabelText, getByText, getByAltText, queryByText };
  };

  describe('site logo', () => {
    beforeAll(() => {
      window.SITE_NAME = 'My Site';
      window.GLOBALS.SITE = {
        company_logo: 'my/logo.png',
      };
    });

    afterAll(() => {
      window.SITE_NAME = 'MetaDeploy';
      window.GLOBALS = {};
    });

    test('renders logo', () => {
      const { getByAltText } = setup();

      expect(getByAltText('My Site')).toBeVisible();
    });
  });

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

  describe('logged out, hideLogin: true', () => {
    test('renders no header controls', () => {
      const { container, queryByText } = setup(
        {},
        {
          hideLogin: true,
        },
      );
      const login = queryByText('Log In');
      const logout = container.querySelector('#logout');

      expect(login).toBeNull();
      expect(logout).toBeNull();
    });
  });

  describe('offline', () => {
    test('renders OfflineAlert if websocket disconnected', () => {
      const { getByText } = setup();

      expect(getByText('reload the page.')).toBeVisible();
    });

    test('does not render OfflineAlert if websocket connected', () => {
      const initialState = { user: null, socket: true };
      const { queryByText } = setup(initialState);

      expect(queryByText('reload the page.')).toBeNull();
    });
  });

  describe('currently running job', () => {
    test('renders CurrentJobAlert', () => {
      const initialState = {
        user: { username: 'Test User' },
        orgs: {
          'org-id': {
            org_id: 'org-id',
            current_job: {
              id: 'my-job',
              product_slug: 'my-product',
              version_label: 'my-version',
              plan_slug: 'my-plan',
              plan_average_duration: '119.999',
            },
          },
        },
      };
      const { getByText } = setup(initialState);

      expect(
        getByText(
          'An installation is currently running on this org. Average install time is 2 minutes.',
        ),
      ).toBeVisible();
    });
  });
});
