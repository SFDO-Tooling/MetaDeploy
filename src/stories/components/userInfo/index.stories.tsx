import { Story } from '@storybook/react/types-6-0';
import React, { ComponentProps } from 'react';

import UserInfo from '@/js/components/jobs/userInfo';
import { Job } from '@/js/store/jobs/reducer';

import { sampleJob1 } from '../../fixtures';

export default {
  title: 'Components/UserInfo/Example',
  component: UserInfo,
};


const Template = (props: Props) => <UserInfo {...props} />;

export const UserInfoComponent = Template.bind({});
UserInfoComponent.args = {
  job: sampleJob1 as unknown as Job,
}



UserInfoComponent.storyName = 'User Info';
