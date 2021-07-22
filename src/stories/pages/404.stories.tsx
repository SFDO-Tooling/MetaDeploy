import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import FourOhFour from '@/components/404';

import { withRedux } from '../decorators';

export default {
  title: 'Pages/404/Example',
  component: FourOhFour,
  decorators: [withRedux()],
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
      We can’t find the Product you’re looking for. Try another Product from{' '}
      <a href="#">this page</a>.
    </>
  ),
};
Custom404.argTypes = {
  message: { control: { disable: true } },
};
Custom404.storyName = 'Custom Message';
