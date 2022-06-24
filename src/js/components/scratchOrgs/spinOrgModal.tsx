import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import React, { ChangeEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
  isOpen: boolean;
  clickThroughAgreement: string | null;
  toggleModal: (open: boolean) => void;
  doSpinOrg: (email: string) => void;
};

const SpinOrg = ({
  isOpen,
  clickThroughAgreement,
  toggleModal,
  doSpinOrg,
}: Props) => {
  const { t } = useTranslation();
  const masterAgreement = window.GLOBALS.SITE?.master_agreement;
  const [confirmed, setConfirmed] = useState(!clickThroughAgreement);
  const [msaConfirmed, setMsaConfirmed] = useState(!masterAgreement);
  const EMAIL_PAGE = 2;
  const CLICKTHROUGH_PAGE = 1;
  const MSA_PAGE = 0;

  let startPage = EMAIL_PAGE;

  if (masterAgreement) {
    startPage = MSA_PAGE;
  } else if (clickThroughAgreement) {
    startPage = CLICKTHROUGH_PAGE;
  }
  const [currentPage, setCurrentPage] = useState(startPage);
  const [email, setEmail] = useState('');

  const nextPage = useCallback(() => {
    switch (currentPage) {
      case 0:
        // If `confirmed` is truthy, either there is no clickthrough
        // or the user already approved it.
        setCurrentPage(confirmed ? EMAIL_PAGE : CLICKTHROUGH_PAGE);
        break;
      case 1:
        setCurrentPage(EMAIL_PAGE);
        break;
    }
  }, [currentPage, confirmed]);

  const resetAndClose = useCallback(() => {
    setConfirmed(!clickThroughAgreement);
    setMsaConfirmed(!masterAgreement);
    setEmail('');
    setCurrentPage(startPage);
    toggleModal(false);
  }, [startPage, clickThroughAgreement, masterAgreement, toggleModal]);

  const handleSubmit = useCallback(() => {
    /* istanbul ignore next */
    if (
      (currentPage === MSA_PAGE && msaConfirmed) ||
      (currentPage === CLICKTHROUGH_PAGE && confirmed)
    ) {
      nextPage();
    } /* istanbul ignore else */ else if (email && confirmed && msaConfirmed) {
      doSpinOrg(email);
      resetAndClose();
    }
  }, [
    confirmed,
    msaConfirmed,
    currentPage,
    doSpinOrg,
    email,
    nextPage,
    resetAndClose,
  ]);

  const handleConfirmChange = useCallback(
    (
      event: ChangeEvent<HTMLInputElement>,
      { checked }: { checked: boolean },
    ) => {
      setConfirmed(checked);
    },
    [],
  );

  const handleConfirmMsaChange = useCallback(
    (
      event: ChangeEvent<HTMLInputElement>,
      { checked }: { checked: boolean },
    ) => {
      setMsaConfirmed(checked);
    },
    [],
  );

  const handleEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, { value }: { value: string }) => {
      setEmail(value);
    },
    [],
  );

  const pages = [
    {
      heading: t('Master Services Agreement'),
      content: masterAgreement ? (
        <>
          <div
            className="slds-text-longform slds-scrollable_y slds-box markdown"
            style={{ maxHeight: '250px' }}
            dangerouslySetInnerHTML={{
              __html: masterAgreement,
            }}
          />
          <Checkbox
            id="click-through-confirm"
            className="slds-p-top_medium"
            checked={msaConfirmed}
            required
            labels={{
              label: t(
                'I confirm I have read and agree to these terms of use and licenses.',
              ),
            }}
            onChange={handleConfirmMsaChange}
          />
        </>
      ) : null,
    },
    {
      heading: t('Product Terms of Use and Licenses'),
      content: clickThroughAgreement ? (
        <>
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
            required
            labels={{
              label: t(
                'I confirm I have read and agree to these product terms of use and licenses.',
              ),
            }}
            onChange={handleConfirmChange}
          />
        </>
      ) : null,
    },
    {
      heading: t('Enter Your Email Address'),
      content: (
        <form className="slds-p-around_large" onSubmit={handleSubmit}>
          <div
            id="scratch-org-email-help"
            className="slds-form-element__help slds-p-bottom_small"
          >
            {t(
              'This email will be used as the admin of the scratch org that is created.',
            )}
          </div>
          <Input
            id="scratch-org-email"
            type="email"
            label={t('Email')}
            value={email}
            required
            onChange={handleEmailChange}
            aria-describedby="scratch-org-email-help"
          />
        </form>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      dismissOnClickOutside={false}
      onRequestClose={resetAndClose}
      size="medium"
      heading={pages[currentPage].heading}
      footer={[
        <Button key="cancel" label={t('Cancel')} onClick={resetAndClose} />,
        <Button
          key="confirm"
          label={currentPage === 2 ? t('Confirm') : t('Confirm & Next')}
          variant="brand"
          onClick={handleSubmit}
          disabled={
            (currentPage === 0 && !msaConfirmed) ||
            (currentPage === 1 && !confirmed) ||
            (currentPage === 2 && !email)
          }
        />,
      ]}
    >
      <div className="slds-p-horizontal_large slds-p-vertical_medium">
        {pages[currentPage].content}
      </div>
    </Modal>
  );
};

export default SpinOrg;
