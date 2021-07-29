import { fireEvent } from '@testing-library/react';
import React from 'react';
import { StaticRouter } from 'react-router-dom';

import OldVersionWarning from '@/js/components/products/oldVersionWarning';

import { render } from './../../utils';

describe('<OldVersionWarning/>', () => {
  const setup = (options) => {
    const defaults = {};
    const opts = { ...defaults, ...options };
    const context = {};
    const { getByText, queryByText } = render(
      <StaticRouter context={context}>
        <OldVersionWarning link={opts.link} />
      </StaticRouter>,
    );
    return {
      getByText,
      queryByText,
      context,
    };
  };

  test('closes on click', () => {
    const { getByText, queryByText } = setup();
    const closeBtn = getByText('Close');
    fireEvent.click(closeBtn);

    expect(queryByText('Close')).toBeNull();
  });

  test('navigates to link on click', () => {
    const { context, getByText } = setup({ link: 'foobar' });
    fireEvent.click(getByText('Go to the most recent version.'));

    expect(context.action).toEqual('PUSH');
    expect(context.url).toEqual('foobar');
  });
});
