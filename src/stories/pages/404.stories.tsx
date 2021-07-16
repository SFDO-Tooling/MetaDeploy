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

export const FourOhFourComponent = Template.bind({});
FourOhFourComponent.argTypes = {
  message: { control: 'text' },
};
FourOhFourComponent.storyName = '404';
