import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import FourOhFour from '@/js/components/404';

import { withRedux } from '../decorators';

export default {
  title: 'Pages/404/Examples',
  component: FourOhFour,
  decorators: [withRedux({ socket: true })],
};

const Template: Story<ComponentProps<typeof FourOhFour>> = (args) => (
  <FourOhFour {...args} />
);

export const Default404 = Template.bind({});
Default404.argTypes = {
  message: { control: 'text' },
};
Default404.storyName = 'Default';

export const Custom404 = Template.bind({});
Custom404.args = {
  message: (
    <>
      We can’t find the product you’re looking for. Try the{' '}
      <a href="#">list of all products</a>?
    </>
  ),
};
Custom404.argTypes = {
  message: { control: { disable: true } },
};
Custom404.storyName = 'Custom Message';
