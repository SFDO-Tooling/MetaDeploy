import { action } from '@storybook/addon-actions';
import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import StepsTableComponent from '@/js/components/plans/stepsTable';
import { Job } from '@/js/store/jobs/reducer';
import { Preflight } from '@/js/store/plans/reducer';

import { withRedux } from '../decorators';
import {
  sampleJob1,
  sampleJob2,
  sampleJob3,
  samplePlan1,
  samplePreflight1,
  samplePreflight2,
} from '../fixtures';

export default {
  title: 'Plans/StepsTable/Examples',
  component: StepsTableComponent,
  decorators: [withRedux({ socket: true })],
};

const sampleJobs: { [key: string]: Job } = {
  Started: sampleJob1,
  Complete: sampleJob2,
  Failed: sampleJob3,
};
const samplePreflights: { [key: string]: Preflight } = {
  Success: samplePreflight1,
  Error: samplePreflight2,
};

type Props = ComponentProps<typeof StepsTableComponent>;

interface StoryProps extends Omit<Props, 'job' | 'preflight'> {
  job: string;
  preflight: string;
}

const Template = ({ job, preflight, ...rest }: StoryProps) => (
  <StepsTableComponent
    job={sampleJobs[job]}
    preflight={samplePreflights[preflight]}
    {...rest}
  />
);

export const PreValidation: Story<StoryProps> = Template.bind({});
PreValidation.args = {
  plan: samplePlan1,
  steps: samplePlan1.steps,
  canInstall: false,
  handleStepsChange: action('handleStepsChange'),
};
PreValidation.argTypes = {
  canInstall: { control: { disable: true } },
  preflight: { control: { disable: true } },
  selectedSteps: { control: { disable: true } },
  job: { control: { disable: true } },
};
PreValidation.storyName = 'Needs pre-install validation';

export const PostValidation: Story<StoryProps> = Template.bind({});
PostValidation.args = {
  preflight: 'Success',
  plan: samplePlan1,
  steps: samplePlan1.steps,
  canInstall: true,
  handleStepsChange: action('handleStepsChange'),
};
PostValidation.argTypes = {
  preflight: {
    options: Object.keys(samplePreflights),
    control: { type: 'select' },
  },
  canInstall: { control: { disable: true } },
  job: { control: { disable: true } },
  selectedSteps: { control: { disable: true } },
};
PostValidation.storyName = 'Pre-install validation complete';

export const InstallationJob: Story<StoryProps> = Template.bind({});
InstallationJob.args = {
  job: 'Started',
  plan: samplePlan1,
  steps: samplePlan1.steps,
  handleStepsChange: action('handleStepsChange'),
};
InstallationJob.argTypes = {
  canInstall: { control: { disable: true } },
  job: { options: Object.keys(sampleJobs), control: { type: 'select' } },
  plan: { control: { disable: true } },
  steps: { control: { disable: true } },
  preflight: { control: { disable: true } },
  selectedSteps: { control: { disable: true } },
};
InstallationJob.storyName = 'Installation';
