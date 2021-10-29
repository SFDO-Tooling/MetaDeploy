import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/plans/userInfo';
import { User } from '@/js/store/user/reducer';

import { samplePlan1, sampleUser1 } from '../../fixtures';

export default {
  title: 'Plans/UserInfo/Examples',
  component: UserInfo,
};

const sampleUsers: { [key: string]: User } = {
  'Logged In': sampleUser1,
  'Logged Out': null,
};

type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => {
  window.GLOBALS.SCRATCH_ORGS_AVAILABLE = true;
  /* @@@ TOD0: Test window.GLOBAL.SSCRATCH_ORGS_AVAILABLE . . . doesn't affect other stories @@@ */
  /* console.log(window.GLOBALS) */
  return <UserInfo {...props} />;
};

export const UserInfoComponent: Story<Props> = Template.bind({});
UserInfoComponent.args = {
  plan: samplePlan1,
  user: 'Logged In' as unknown as User,
};
UserInfoComponent.argTypes = {
  plan: { table: { disable: true } },
  user: {
    type: { name: 'string' },
    control: { type: 'select' },
    options: Object.keys(sampleUsers),
    mapping: sampleUsers,
  },
};
UserInfoComponent.storyName = 'User Info';
