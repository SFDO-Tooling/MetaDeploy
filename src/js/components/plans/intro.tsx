import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
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
  clickThroughAgreement,
  preMessage,
  postMessage,
  backLink,
}: {
  averageDuration: string | null;
  isProductionOrg: boolean;
  results: React.ReactNode;
  cta: React.ReactNode;
  clickThroughAgreement: string | null;
  preMessage?: React.ReactNode;
  postMessage?: React.ReactNode;
  backLink?: React.ReactNode;
}) => {
  const [
    createOrgAgreementModalOpen,
    setcreateOrgAgreementModalOpen,
  ] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const duration = getDuration(averageDuration);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    setConfirmed(checked);
  };
  const handleConfirmTerms = () => {
    console.log('go to page 2');
  };
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
        className="slds-m-top_medium slds-p-vertical_xx-small"
        onClick={() => setcreateOrgAgreementModalOpen(true)}
      />
      {backLink}
      {clickThroughAgreement && (
        <Modal
          isOpen={createOrgAgreementModalOpen}
          onRequestClose={closeAgreementModal}
          size="medium"
          heading={i18n.t('Product Terms of Use & Licenses')}
          footer={[
            <Button
              key="cancel"
              label="Cancel"
              onClick={closeAgreementModal}
            />,
            <Button
              key="confirm"
              label="Confirm"
              variant="brand"
              onClick={handleConfirmTerms}
            />,
          ]}
        >
          <div className="slds-p-horizontal_large slds-p-vertical_medium">
            {/* This text is pre-cleaned by the API */}
            <div
              className="slds-text-longform slds-scrollable_y slds-box markdown"
              style={{ maxHeight: '250px' }}
              dangerouslySetInnerHTML={{
                __html: clickThroughAgreement,
              }}
            />
            <Checkbox
              id="click-through-confirm"
              className="slds-p-top_medium"
              checked={confirmed}
              labels={{
                label: i18n.t(
                  'I confirm I have read and agree to these product terms of use and licenses.',
                ),
              }}
              onChange={handleChange}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Intro;
