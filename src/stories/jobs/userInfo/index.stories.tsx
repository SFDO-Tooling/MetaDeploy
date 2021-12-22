import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/jobs/userInfo';
import { ScratchOrg } from '@/js/store/scratchOrgs/reducer';

import { sampleJob1, sampleScratchOrg1 } from '../../fixtures';

export default {
  title: 'Jobs/UserInfo/Example',
  component: UserInfo,
};

const sampleScratchOrgs: { [key: string]: ScratchOrg | null } = {
  'With Scratch Org': sampleScratchOrg1,
  'With Persistent Org': null,
};
type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => <UserInfo {...props} />;

export const UserInfoComponent: Story<Props> = Template.bind({});
UserInfoComponent.args = {
  job: sampleJob1,
  scratchOrg: 'With Scratch Org' as unknown as ScratchOrg,
};
UserInfoComponent.argTypes = {
  job: { table: { disable: true } },
  scratchOrg: {
    type: { name: 'string' },
    control: { type: 'select' },
    options: Object.keys(sampleScratchOrgs),
    mapping: sampleScratchOrgs,
  },
};
UserInfoComponent.storyName = 'User Info';
