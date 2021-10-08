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
const samplePreflights: { [key: string]: Preflight | null } = {
  None: null,
  Success: samplePreflight1,
  Error: samplePreflight2,
};

type Props = ComponentProps<typeof StepsTableComponent>;

const Template = (props: Props) => <StepsTableComponent {...props} />;

export const PlanSteps: Story<Props> = Template.bind({});
PlanSteps.args = {
  plan: samplePlan1,
  preflight: 'None' as unknown as Preflight | null,
  steps: samplePlan1.steps,
  canInstall: true,
  handleStepsChange: action('handleStepsChange'),
};
PlanSteps.argTypes = {
  plan: { table: { disable: true } },
  preflight: {
    type: { name: 'string' },
    control: { type: 'select' },
    options: Object.keys(samplePreflights),
    mapping: samplePreflights,
  },
  job: { table: { disable: true } },
  selectedSteps: { table: { disable: true } },
  canInstall: { table: { disable: true } },
  handleStepsChange: { table: { disable: true } },
};
PlanSteps.storyName = 'Pre-install validation';

export const InstallationJob: Story<Props> = Template.bind({});
InstallationJob.args = {
  plan: samplePlan1,
  job: 'Started' as unknown as Job,
  steps: samplePlan1.steps,
};
InstallationJob.argTypes = {
  plan: { table: { disable: true } },
  preflight: { table: { disable: true } },
  job: {
    type: { name: 'string' },
    control: { type: 'select' },
    options: Object.keys(sampleJobs),
    mapping: sampleJobs,
  },
  selectedSteps: { table: { disable: true } },
  canInstall: { table: { disable: true } },
  handleStepsChange: { table: { disable: true } },
};
InstallationJob.storyName = 'Installation';
