import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import { sampleJob1 } from '../fixtures';
import { SUPPORTED_ORGS } from '@/utils/constants';

import ProgressIndicator from '@/components/jobs/progressIndicator'

export default {
  title: 'Jobs/ProgressIndicator/Example',
  component: ProgressIndicator,
}

const Template: Story<ComponentProps<typeof ProgressIndicator>> = (args) => (
  <ProgressIndicator {...args} />
);

export const ProgressIndicatorComponent = Template.bind({});

ProgressIndicatorComponent.args = {
  job: sampleJob1,
  preflightRequired: true,
  supportedOrgs: SUPPORTED_ORGS.Both
};
ProgressIndicatorComponent.argTypes = {
  job: { control: { disable: true } },
  preflightRequired: { control: { disable: true } },
  supportedOrgs: { control: { disable: true } },
};

ProgressIndicatorComponent.storyName = 'Progress Indicator';
