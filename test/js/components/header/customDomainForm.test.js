import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent } from 'react-testing-library';

import { renderWithRedux } from './../../utils';

import CustomDomainForm from 'components/header/customDomainForm';

describe('<CustomDomainForm />', () => {
  const setup = () => {
    const initialState = { user: null };
    const { getByLabelText, getByText, getByTestId } = renderWithRedux(
      <MemoryRouter>
        <CustomDomainForm />
      </MemoryRouter>,
      initialState,
    );
    return { getByLabelText, getByText, getByTestId };
  };

  test('updates label when input changes', () => {
    const { getByLabelText, getByText, getByTestId } = setup();
    const input = getByLabelText('Use Custom Domain');

    expect(input).toBeVisible();
    expect(getByTestId('custom-domain')).toHaveTextContent('domain');

    fireEvent.change(input, { target: { value: ' ' } });

    expect(getByTestId('custom-domain')).toHaveTextContent('domain');

    fireEvent.change(input, { target: { value: ' foobar' } });

    expect(getByText('https://foobar.my.salesforce.com')).toBeVisible();
  });

  test('updates window.location.href on submit', () => {
    const { getByLabelText, getByText } = setup();

    window.location.assign = jest.fn();
    const input = getByLabelText('Use Custom Domain');
    fireEvent.change(input, { target: { value: ' ' } });
    fireEvent.click(getByText('Continue'));

    expect(window.location.assign).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'foobar' } });
    fireEvent.click(getByText('Continue'));
    const baseUrl = window.api_urls.salesforce_custom_login();
    const expected = `${baseUrl}?custom_domain=foobar`;

    expect(window.location.assign).toHaveBeenCalledWith(expected);
  });
});
