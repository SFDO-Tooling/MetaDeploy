import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/plans/userInfo';
import { ScratchOrg } from '@/js/store/scratchOrgs/reducer';
import { User } from '@/js/store/user/reducer';

import {
  samplePlan1,
  samplePlan2,
  sampleScratchOrg1,
  sampleScratchOrg2,
  sampleUser1,
} from '../../fixtures';

export default {
  title: 'Plans/UserInfo/Examples',
  component: UserInfo,
};

const sampleUsers: { [key: string]: User } = {
  'Logged In': sampleUser1,
  'Logged Out': null,
};

const sampleScratchOrgs: { [key: string]: ScratchOrg } = {
  'Expiration Date': sampleScratchOrg1,
  'Days Remaining': sampleScratchOrg2,
};

type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => {
  window.GLOBALS.SCRATCH_ORGS_AVAILABLE = true;
  return <UserInfo {...props} />;
};

export const DisconnectedUserInfoComponent: Story<Props> = Template.bind({});
DisconnectedUserInfoComponent.args = {
  plan: samplePlan1,
  user: 'Logged Out' as unknown as User,
};
DisconnectedUserInfoComponent.argTypes = {
  plan: { table: { disable: true } },
  user: {
    table: { disable: true },
    type: { name: 'string' },
    mapping: sampleUsers,
  },
};
DisconnectedUserInfoComponent.storyName = 'Disconnected';

export const DevUserInfoComponent: Story<Props> = Template.bind({});
DevUserInfoComponent.args = {
  plan: samplePlan1,
  user: 'Logged In' as unknown as User,
};
DevUserInfoComponent.argTypes = {
  plan: { table: { disable: true } },
  user: {
    table: { disable: true },
    type: { name: 'string' },
    mapping: sampleUsers,
  },
};
DevUserInfoComponent.storyName = 'Production or Developer Org';

export const OrgUserInfoComponent: Story<Props> = Template.bind({});
OrgUserInfoComponent.args = {
  user: null,
  plan: samplePlan2,
  scratchOrg: 'Expiration Date' as unknown as ScratchOrg,
};
OrgUserInfoComponent.argTypes = {
  user: { table: { disable: true } },
  plan: { table: { disable: true } },
  scratchOrg: {
    type: { name: 'string' },
    control: { type: 'select' },
    options: Object.keys(sampleScratchOrgs),
    mapping: sampleScratchOrgs,
  },
};

OrgUserInfoComponent.storyName = 'Connected With Scratch Org';
