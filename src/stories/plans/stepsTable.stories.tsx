import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import StepsTableComponent from '@/js/components/plans/stepsTable';

import { withRedux } from '../decorators';
import { sampleJob2, samplePlan1, sampleStep3, sampleStep4 } from '../fixtures';

export default {
  title: 'Plans/StepsTable/Example',
  component: StepsTableComponent,
  decorators: [withRedux({ socket: true })],
};

const Template: Story<ComponentProps<typeof StepsTableComponent>> = (args) => (
  <StepsTableComponent {...args} />
);

export const StepsTable = Template.bind({});

StepsTable.args = {
  job: sampleJob2,
  plan: samplePlan1,
  steps: [sampleStep3, sampleStep4],
  handleStepsChange: action('handleStepsChange'),
};
StepsTable.argTypes = {
  canInstall: { control: { disable: true } },
  job: { control: { disable: true } },
  plan: { control: { disable: true } },
  steps: { control: { disable: true } },
  preflight: { control: { disable: true } },
  selectedSteps: { control: { disable: true } },
};

StepsTable.storyName = 'Steps Table';
