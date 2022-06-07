import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const reloadPage = (): void => {
  window.location.reload();
};

const OfflineAlert = () => {
  const { t } = useTranslation();

  return (
    <AlertContainer className="offline-alert">
      <Alert
        labels={{
          heading: t(
            'You are in offline mode. We are trying to reconnect, but you may need to',
          ),
          headingLink: t('reload the page.'),
        }}
        onClickHeadingLink={reloadPage}
        variant="offline"
      />
    </AlertContainer>
  );
};

export default OfflineAlert;
