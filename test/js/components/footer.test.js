import React from 'react';
import { render } from 'enzyme';

import Footer from 'components/footer';

describe('<Footer />', () => {
  test('renders logo with `backgroundImage` set to `logoSrc`', () => {
    const wrapper = render(<Footer logoSrc="my/logo.png" />);
    expect(wrapper.find('.slds-global-footer__logo').attr('style')).toBe(
      'background-image:url(my/logo.png);',
    );
  });
});
