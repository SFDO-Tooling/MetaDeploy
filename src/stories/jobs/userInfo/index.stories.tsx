import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/jobs/userInfo';

import { sampleJob1 } from '../../fixtures';

export default {
  title: 'Jobs/UserInfo/Example',
  component: UserInfo,
};

type Props = ComponentProps<typeof UserInfo>;

const Template = (props: Props) => <UserInfo {...props} />;

export const UserInfoComponent: Story<Props> = Template.bind({});
UserInfoComponent.args = {
  job: sampleJob1,
};
UserInfoComponent.argTypes = {
  job: { table: { disable: true } },
};

UserInfoComponent.storyName = 'User Info';
