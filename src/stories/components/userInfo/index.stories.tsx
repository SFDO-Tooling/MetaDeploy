import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/plans/userInfo';

/* import UserInfo from '@/js/components/jobs/userInfo'; */
import { samplePlan1, sampleUser1 } from '../../fixtures';

export default {
  title: 'Components/UserInfo/Example',
  component: UserInfo,
};

type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => <UserInfo {...props} />;

export const UserInfoComponent: Story<Props> = Template.bind({});
UserInfoComponent.args = {
  plan: samplePlan1,
  user: sampleUser1,
};

UserInfoComponent.storyName = 'User Info';
