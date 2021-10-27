import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/plans/userInfo';
import { User } from '@/js/store/user/reducer';

/* import * as JobsUserInfo from '@/js/components/jobs/userInfo'; */
import { samplePlan1, sampleUser1, sampleUser2 } from '../../fixtures';

export default {
  title: 'Components/UserInfo/Examples',
  component: UserInfo,
};

const sampleUsers: { [key: string]: User } = {
  'Logged In': sampleUser1,
  'Logged Out': sampleUser2,
};

type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => <UserInfo {...props} />;

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
