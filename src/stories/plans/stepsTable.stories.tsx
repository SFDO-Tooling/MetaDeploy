import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import StepsTable from '@/js/components/plans/stepsTable';

import { samplePlan1 } from '../fixtures';

export default {
  title: 'Plans/StepsTable/Example',
  component: StepsTable,
};

type Props = ComponentProps<typeof StepsTable>;

const Template: Story<ComponentProps<typeof StepsTable>> = (args) => (
  <StepsTable {...args} />
);

export const StepsTableComponent = Template.bind({});

StepsTableComponent.args = {
  plan: samplePlan1,
};

StepsTableComponent.storyName = 'Steps Table';
