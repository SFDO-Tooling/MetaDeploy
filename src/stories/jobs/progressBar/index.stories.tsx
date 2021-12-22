import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ProgressBar from '@/js/components/jobs/progressBar';
import { Job } from '@/js/store/jobs/reducer';

import { sampleJob1, sampleJob2, sampleJob3, sampleJob4 } from '../../fixtures';

export default {
  title: 'Jobs/ProgressBar/Example',
  component: ProgressBar,
};

const sampleJobs: { [key: string]: Job } = {
  Started: sampleJob1,
  Complete: sampleJob2,
  Failed: sampleJob3,
  Canceled: sampleJob4,
};

type Props = ComponentProps<typeof ProgressBar>;

const Template = (props: Props) => <ProgressBar {...props} />;

export const ProgressBarComponent: Story<Props> = Template.bind({});
ProgressBarComponent.args = {
  job: 'Started' as unknown as Job,
};
ProgressBarComponent.argTypes = {
  job: {
    type: { name: 'string' },
    control: { type: 'select' },
    options: Object.keys(sampleJobs),
    mapping: sampleJobs,
  },
};
ProgressBarComponent.storyName = 'Progress Bar';
