import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import StepsTableComponent from '@/js/components/plans/stepsTable';

import { withRedux } from '../decorators';
import { sampleJob1, samplePlan1, sampleStep1, sampleStep2 } from '../fixtures';

export default {
  title: 'Plans/StepsTable/Example',
  component: StepsTableComponent,
  decorators: [
    withRedux({
      socket: true,
      showLogs: true,
      expandedPanels: new Set(),
    }),
  ],
};

const Template: Story<ComponentProps<typeof StepsTableComponent>> = (args) => (
  <StepsTableComponent {...args} />
);

export const StepsTable = Template.bind({});

StepsTable.args = {
  canInstall: true,
  job: sampleJob1,
  plan: samplePlan1,
  steps: [sampleStep1, sampleStep2],
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
