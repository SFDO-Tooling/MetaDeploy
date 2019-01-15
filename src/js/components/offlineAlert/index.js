// @flow

import * as React from 'react';
import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import Icon from '@salesforce/design-system-react/components/icon';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';

const OfflineAlert = () => (
  <IconSettings iconPath="/assets/icons">
    <AlertContainer className="offline-alert">
      <Alert
        icon={
          <Icon
            assistiveText={{ label: 'Offline' }}
            category="utility"
            name="offline"
            size="small"
            inverse
          />
        }
        labels={{
          heading: 'You are in offline mode.',
        }}
        variant="offline"
      />
    </AlertContainer>
  </IconSettings>
);

export default OfflineAlert;
