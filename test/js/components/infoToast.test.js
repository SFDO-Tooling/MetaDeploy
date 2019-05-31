import React from 'react';
import { fireEvent, render } from 'react-testing-library';

import InfoToast from 'components/infoToast';

describe('<InfoToast/>', () => {
  test('closes on click', () => {
    const { getByText } = render(<InfoToast />);
    const closeBtn = getByText('close');
    fireEvent.click(closeBtn);
    expect(closeBtn).toBeNull();
  });
});
