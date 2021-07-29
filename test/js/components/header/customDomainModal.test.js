import { fireEvent } from '@testing-library/react';
import React from 'react';

import CustomDomainModal from '@/js/components/header/customDomainModal';
import { addUrlParams } from '@/js/utils/api';

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

  test('updates window.location.href on submit', () => {
    const { getByLabelText, getByText } = setup();

    jest.spyOn(window.location, 'assign');
    const input = getByLabelText('Custom Domain');
    fireEvent.change(input, { target: { value: ' ' } });
    fireEvent.click(getByText('Continue'));

    expect(window.location.assign).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'foobar' } });
    fireEvent.click(getByText('Continue'));
    const baseUrl = window.api_urls.salesforce_login();
    const expected = addUrlParams(baseUrl, {
      custom_domain: 'foobar',
      next: window.location.pathname,
    });

    expect(window.location.assign).toHaveBeenCalledWith(expected);
  });

  test('adds redirectParams, if exist', () => {
    const { getByLabelText, getByText } = setup({
      redirectParams: { foo: 'bar' },
    });

    jest.spyOn(window.location, 'assign');
    const input = getByLabelText('Custom Domain');
    fireEvent.change(input, { target: { value: 'foobar' } });
    fireEvent.click(getByText('Continue'));
    const baseUrl = window.api_urls.salesforce_login();
    const expected = addUrlParams(baseUrl, {
      custom_domain: 'foobar',
      next: addUrlParams(window.location.pathname, { foo: 'bar' }),
    });

    expect(window.location.assign).toHaveBeenCalledWith(expected);
  });

  describe('cancel', () => {
    test('closes modal', () => {
      const { getByText } = setup();
      fireEvent.click(getByText('Cancel'));

      expect(toggleModal).toHaveBeenCalledWith(false);
    });
  });
});
