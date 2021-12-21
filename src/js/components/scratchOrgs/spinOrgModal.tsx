import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import { t } from 'i18next';
import React, { useCallback, useState } from 'react';

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
  const [confirmed, setConfirmed] = useState(!clickThroughAgreement);
  const [currentPage, setCurrentPage] = useState(clickThroughAgreement ? 0 : 1);
  const [email, setEmail] = useState('');

  const nextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage]);

  const resetAndClose = useCallback(() => {
    setConfirmed(!clickThroughAgreement);
    setEmail('');
    setCurrentPage(clickThroughAgreement ? 0 : 1);
    toggleModal(false);
  }, [clickThroughAgreement, toggleModal]);

  const handleSubmit = useCallback(() => {
    /* istanbul ignore next */
    if (confirmed) {
      if (currentPage === 0) {
        nextPage();
      } /* istanbul ignore else */ else if (email) {
        doSpinOrg(email);
        resetAndClose();
      }
    }
  }, [confirmed, currentPage, doSpinOrg, email, nextPage, resetAndClose]);

  const handleConfirmChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      { checked }: { checked: boolean },
    ) => {
      setConfirmed(checked);
    },
    [],
  );

  const handleEmailChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      { value }: { value: string },
    ) => {
      setEmail(value);
    },
    [],
  );

  const pages = [
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
      onRequestClose={resetAndClose}
      size="medium"
      heading={pages[currentPage].heading}
      footer={[
        <Button key="cancel" label={t('Cancel')} onClick={resetAndClose} />,
        <Button
          key="confirm"
          label={currentPage === 0 ? t('Confirm & Next') : t('Confirm')}
          variant="brand"
          onClick={handleSubmit}
          disabled={
            (currentPage === 0 && !confirmed) || (currentPage === 1 && !email)
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
