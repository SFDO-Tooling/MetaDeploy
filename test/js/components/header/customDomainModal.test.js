import { fireEvent } from '@testing-library/react';
import React from 'react';

import CustomDomainModal from '@/js/components/header/customDomainModal';

import { render } from './../../utils';

describe('<CustomDomainModal />', () => {
  const toggleModal = jest.fn();

  const setup = (options) => {
    const defaults = {
      isOpen: true,
    };
    const opts = { ...defaults, ...options };
    const { getByLabelText, getByText, getByTestId } = render(
      <CustomDomainModal
        isOpen={opts.isOpen}
        toggleModal={toggleModal}
        redirectParams={opts.redirectParams}
      />,
    );
    return { getByLabelText, getByText, getByTestId };
  };

  test('updates label when input changes', () => {
    const { getByLabelText, getByTestId } = setup();
    const input = getByLabelText('Custom Domain');

    expect(input).toBeVisible();
    expect(getByTestId('custom-domain')).toHaveTextContent('domain');

    fireEvent.change(input, { target: { value: ' ' } });

    expect(getByTestId('custom-domain')).toHaveTextContent('domain');

    fireEvent.change(input, { target: { value: ' foobar' } });

    expect(getByTestId('custom-domain')).toHaveTextContent('foobar');

    fireEvent.change(input, {
      target: { value: 'https://foobar.my.salesforce.com' },
    });

    expect(getByTestId('custom-domain')).toHaveTextContent('foobar');
  });

  test('enables button when input is valid', () => {
    const { getByLabelText, getByTestId } = setup();
    const input = getByLabelText('Custom Domain');

    expect(getByTestId('continue-btn')).not.toBeEnabled();

    fireEvent.change(input, { target: { value: ' ' } });

    expect(getByTestId('continue-btn')).not.toBeEnabled();

    fireEvent.change(input, { target: { value: ' foobar' } });

    expect(getByTestId('continue-btn')).toBeEnabled();

    fireEvent.change(input, {
      target: { value: 'https://foobar.my.salesforce.com' },
    });

    expect(getByTestId('continue-btn')).toBeEnabled();
  });

  test('adds redirectParams, if exist', () => {
    const { getByTestId } = setup({
      redirectParams: { foo: 'bar' },
    });

    expect(getByTestId('custom-login-next')).toHaveValue('/?foo=bar');
  });

  describe('cancel', () => {
    test('closes modal', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Cancel'));

      expect(toggleModal).toHaveBeenCalledWith(false);
    });
  });
});
