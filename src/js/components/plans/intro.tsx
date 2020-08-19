import Button from '@salesforce/design-system-react/components/button';
import Modal from '@salesforce/design-system-react/components/modal';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import i18n from 'i18next';
import React, { useState } from 'react';

import { getDuration } from '@/utils/dates';

const Intro = ({
  averageDuration,
  isProductionOrg,
  results,
  cta,
  preMessage,
  postMessage,
  backLink,
}: {
  averageDuration: string | null;
  isProductionOrg: boolean;
  results: React.ReactNode;
  cta: React.ReactNode;
  preMessage?: React.ReactNode;
  postMessage?: React.ReactNode;
  backLink?: React.ReactNode;
}) => {
  const [
    createOrgAgreementModalOpen,
    setcreateOrgAgreementModalOpen,
  ] = useState(false);
  const duration = getDuration(averageDuration);

  const closeAgreementModal = () => {
    setcreateOrgAgreementModalOpen(false);
  };
  return (
    <div
      className="slds-p-around_medium
        slds-size_1-of-1
        slds-medium-size_1-of-2"
    >
      <div className="slds-text-longform">
        {duration ? (
          <div className="slds-m-bottom_small">
            <strong>{i18n.t('Average Install Time:')}</strong> {duration}.
            {isProductionOrg ? (
              <Tooltip
                content={i18n.t(
                  'Install times in production orgs will vary depending on how many tests need to be run.',
                )}
                assistiveText={{ triggerLearnMoreIcon: 'Disclaimer' }}
                position="overflowBoundaryElement"
                triggerClassName="slds-p-left_xx-small"
              />
            ) : null}
          </div>
        ) : null}
        {preMessage}
        {results}
        {postMessage}
      </div>
      {cta}
      <Button
        label={i18n.t('Create Scratch Org')}
        variant="brand"
        onClick={() => setcreateOrgAgreementModalOpen(true)}
      />
      {backLink}
      <Modal
        isOpen={createOrgAgreementModalOpen}
        onRequestClose={closeAgreementModal}
        size="medium"
        heading={i18n.t('Product Terms of Use & Licenses')}
      >
        terms and such go here...
      </Modal>
    </div>
  );
};

export default Intro;
