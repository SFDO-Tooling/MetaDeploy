import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import ProgressIndicator from '@/js/components/jobs/progressIndicator';
import { Job } from '@/js/store/jobs/reducer';
import { SUPPORTED_ORGS } from '@/js/utils/constants';

import { sampleJob1, sampleJob2, sampleJob3, sampleJob4 } from '../fixtures';

export default {
  title: 'Jobs/ProgressIndicator/Example',
  component: ProgressIndicator,
};

const jobs: { [key: string]: Job } = {
  Started: sampleJob1,
  Complete: sampleJob2,
  Failed: sampleJob3,
  Canceled: sampleJob4,
};

type Props = ComponentProps<typeof ProgressIndicator>;
interface StoryProps extends Omit<Props, 'job'> {
  job: string;
}

const Template = ({ job, ...rest }: StoryProps) => (
  <ProgressIndicator job={jobs[job]} {...rest} />
);
export const ProgressIndicatorComponent: Story<StoryProps> = Template.bind({});

ProgressIndicatorComponent.args = {
  job: 'Started',
  preflightRequired: true,
  supportedOrgs: SUPPORTED_ORGS.Both,
};
ProgressIndicatorComponent.argTypes = {
  job: {
    options: Object.keys(jobs),
    control: {
      type: 'select',
    },
  },
  supportedOrgs: {
    options: Object.values(SUPPORTED_ORGS),
    control: {
      type: 'select',
    },
  },
};

ProgressIndicatorComponent.storyName = 'Progress Indicator';
