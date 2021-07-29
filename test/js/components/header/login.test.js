import { fireEvent } from '@testing-library/react';
import React from 'react';

import Login from '@/js/components/header/login';
import { addUrlParams } from '@/js/utils/api';

import { render } from './../../utils';

describe('<Login />', () => {
  describe('login click', () => {
    test('updates `window.location.href` on login click', () => {
      const { getByText } = render(<Login />);
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Sandbox or Scratch Org'));
      const base = window.api_urls.salesforce_login();
      const expected = addUrlParams(base, {
        custom_domain: 'test',
        next: window.location.pathname,
      });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });

    test('adds redirectParams, if exist', () => {
      const { getByText } = render(<Login redirectParams={{ foo: 'bar' }} />);
      jest.spyOn(window.location, 'assign');
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Sandbox or Scratch Org'));
      const base = window.api_urls.salesforce_login();
      const expected = addUrlParams(base, {
        custom_domain: 'test',
        next: addUrlParams(window.location.pathname, { foo: 'bar' }),
      });

      expect(window.location.assign).toHaveBeenCalledWith(expected);
    });
  });

  describe('custom domain click', () => {
    test('opens modal', () => {
      const { getByText, getByLabelText } = render(<Login />);
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Use Custom Domain'));

      expect(getByLabelText('Custom Domain')).toBeVisible();
    });
  });
});
