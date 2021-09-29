import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ProgressBar from '@/js/components/jobs/progressBar';
import { Job } from '@/js/store/jobs/reducer';

import { sampleJob1, sampleJob2, sampleJob3, sampleJob4 } from '../fixtures';

export default {
  title: 'Jobs/ProgressBar/Example',
  component: ProgressBar,
};

const jobs: { [key: string]: Job } = {
  Started: sampleJob1,
  Complete: sampleJob2,
  Failed: sampleJob3,
  Canceled: sampleJob4,
};

type Props = ComponentProps<typeof ProgressBar>;

interface StoryProps extends Omit<Props, 'job'> {
  job: string;
}

const Template = ({ job, ...rest }: StoryProps) => (
  <ProgressBar job={jobs[job]} {...rest} />
);
export const ProgressBarComponent: Story<StoryProps> = Template.bind({});

ProgressBarComponent.args = {
  job: 'Complete',
};
ProgressBarComponent.argTypes = {
  job: {
    options: Object.keys(jobs),
    control: {
      type: 'select',
    },
  },
};

ProgressBarComponent.storyName = 'Progress Bar';
