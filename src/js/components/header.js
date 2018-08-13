// @flow

import * as React from 'react';
import GlobalHeader from '@salesforce/design-system-react/components/global-header';
import GlobalHeaderDropdown from '@salesforce/design-system-react/components/global-header/dropdown';

const Header = (props: { logoSrc: string }) => (
  <GlobalHeader logoSrc={props.logoSrc}>
    <GlobalHeaderDropdown
      id="login"
      options={[
        {
          label: 'Production or Developer Org',
          href: '/accounts/salesforce/login/',
        },
        {
          label: 'Sandbox Org',
          href: '/accounts/salesforce/login/',
        },
      ]}
      onSelect={opt => {
        window.location.href = opt.href;
      }}
      label="Log In"
      buttonVariant="brand"
      iconVariant={null}
    />
  </GlobalHeader>
);

export default Header;
