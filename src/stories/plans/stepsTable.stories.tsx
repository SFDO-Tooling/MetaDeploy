import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import StepsTableComponent from '@/js/components/plans/stepsTable';
import { Job } from '@/js/store/jobs/reducer';

import { withRedux } from '../decorators';
import { sampleJob1, sampleJob2, sampleJob3, samplePlan1 } from '../fixtures';

export default {
  title: 'Plans/StepsTable/Example',
  component: StepsTableComponent,
  decorators: [withRedux({ socket: true })],
};

const sampleJobs: { [key: string]: Job } = {
  Started: sampleJob1,
  Complete: sampleJob2,
  Failed: sampleJob3,
};

type Props = ComponentProps<typeof StepsTableComponent>;

interface StoryProps extends Omit<Props, 'job'> {
  job: string;
}

const Template = ({ job, ...rest }: StoryProps) => (
  <StepsTableComponent job={sampleJobs[job]} {...rest} />
);

export const StepsTable: Story<StoryProps> = Template.bind({});

StepsTable.args = {
  job: 'Complete',
  plan: samplePlan1,
  steps: samplePlan1.steps,
  handleStepsChange: action('handleStepsChange'),
};
StepsTable.argTypes = {
  canInstall: { control: { disable: true } },
  job: { options: Object.keys(sampleJobs), control: { type: 'select' } },
  plan: { control: { disable: true } },
  steps: { control: { disable: true } },
  preflight: { control: { disable: true } },
  selectedSteps: { control: { disable: true } },
};

StepsTable.storyName = 'Steps Table';
