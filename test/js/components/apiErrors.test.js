import { fireEvent } from '@testing-library/react';
import React from 'react';

import Errors from '@/js/components/apiErrors';

import { render } from './../utils';

describe('<Errors />', () => {
  const doRemoveError = jest.fn();

  const setup = () => {
    const errors = [{ id: 'err1', message: 'This is an error.' }];
    const { getByText } = render(
      <Errors errors={errors} doRemoveError={doRemoveError} />,
    );
    return { getByText };
  };

  const setupforRawHTML = () => {
    const errors = [
      { id: 'err1', message: '<html><div>This is Error</div></html>' },
    ];
    const { getByText } = render(
      <Errors errors={errors} doRemoveError={doRemoveError} />,
    );
    return { getByText };
  };

  test('calls window.location.reload on link click', () => {
    const { getByText } = setup();

    jest.spyOn(window.location, 'reload');
    fireEvent.click(getByText('reload the page.'));

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
  test('for raw html error', () => {
    const { getByText } = setupforRawHTML();

    expect(
      getByText('Something went wrong. Please try again later.'),
    ).toBeVisible();
  });

  test('calls doRemoveError on close click', () => {
    const { getByText } = setup();
    fireEvent.click(getByText('Close'));

    expect(doRemoveError).toHaveBeenCalledTimes(1);
    expect(doRemoveError).toHaveBeenCalledWith('err1');
  });
});
