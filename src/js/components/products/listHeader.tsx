import PageHeader from '@salesforce/design-system-react/components/page-header';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { t } = useTranslation();

  return (
    <PageHeader
      className="page-header slds-p-around_x-large"
      title={t('Select a Product to Install')}
    />
  );
};

export default Header;
