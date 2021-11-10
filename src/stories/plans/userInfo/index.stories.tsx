import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/plans/userInfo';
import { ScratchOrg } from '@/js/store/scratchOrgs/reducer';

import {
  samplePlan1,
  samplePlan2,
  sampleScratchOrg1,
  sampleUser1,
} from '../../fixtures';

export default {
  title: 'Plans/UserInfo/Examples',
  component: UserInfo,
};

const sampleScratchOrgs: { [key: string]: ScratchOrg | null } = {
  'Scratch Org not yet created': null,
  'Scratch Org created': sampleScratchOrg1,
};

type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => <UserInfo {...props} />;

export const DisconnectedUserInfoComponent: Story<Props> = Template.bind({});
DisconnectedUserInfoComponent.args = {
  plan: samplePlan1,
  user: null,
};
DisconnectedUserInfoComponent.argTypes = {
  plan: { table: { disable: true } },
  user: { table: { disable: true } },
};
DisconnectedUserInfoComponent.storyName = 'Disconnected';

export const ConnectedUserInfoComponent: Story<Props> = Template.bind({});
ConnectedUserInfoComponent.args = {
  plan: samplePlan1,
  user: sampleUser1,
};
ConnectedUserInfoComponent.argTypes = {
  plan: { table: { disable: true } },
  user: { table: { disable: true } },
};
ConnectedUserInfoComponent.storyName = 'Connected to Persistent Org';

export const OrgUserInfoComponent: Story<Props> = Template.bind({});
OrgUserInfoComponent.args = {
  plan: samplePlan2,
  user: null,
  scratchOrg: 'Scratch Org not yet created' as unknown as null,
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
OrgUserInfoComponent.storyName = 'Connected to Scratch Org';
