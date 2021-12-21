import { fireEvent } from '@testing-library/react';
import React from 'react';

import Login from '@/js/components/header/login';

import { render } from './../../utils';

describe('<Login />', () => {
  describe('login click', () => {
    test('updates custom_domain on login click', () => {
      const { getByText, getByTestId } = render(<Login />);
      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Sandbox or Scratch Org'));

      expect(getByTestId('custom-domain')).toHaveValue('test');

      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Production or Developer Org'));

      expect(getByTestId('custom-domain')).toHaveValue('login');
    });

    test('adds redirectParams, if exist', () => {
      const { getByTestId } = render(<Login redirectParams={{ foo: 'bar' }} />);

      expect(getByTestId('login-next')).toHaveValue('/?foo=bar');
    });

    test('submits form', () => {
      const { getByText, getByTestId } = render(<Login />);
      const form = getByTestId('login-form');
      form.onsubmit = jest.fn();

      fireEvent.click(getByText('Log In'));
      fireEvent.click(getByText('Production or Developer Org'));

      expect(form.onsubmit).toHaveBeenCalled();
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
