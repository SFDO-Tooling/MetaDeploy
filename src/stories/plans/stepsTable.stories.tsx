import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import StepsTableComponent from '@/js/components/plans/stepsTable';

import { sampleJob1, sampleJob2, samplePlan1 } from '../fixtures';

export default {
  title: 'Plans/StepsTable/Example',
  component: StepsTableComponent,
};


const Template: Story<ComponentProps<typeof StepsTableComponent>> = (args) => (
  <StepsTableComponent {...args} />
);

export const StepsTable = Template.bind({});

StepsTable.args = {
  canInstall: true,
  job: sampleJob2,
  plan: samplePlan1,
  steps: samplePlan1.steps,
  handleStepsChange: action('handleStepsChange'),
};

StepsTable.storyName = 'Steps Table';
