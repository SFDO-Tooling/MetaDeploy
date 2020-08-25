import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Input from '@salesforce/design-system-react/components/input';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

type Props = {
  isOpen: boolean;
  clickThroughAgreement: string | null;
  handleClose: () => void;
  doCreateOrg: (email: string) => void;
};

const SpinOrgModal = ({
  isOpen,
  clickThroughAgreement,
  handleClose,
  doCreateOrg,
}: Props) => {
  const [confirmed, setConfirmed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [email, setEmail] = useState('');

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handleConfirmSubmit = () => {
    /* istanbul ignore else */
    if (confirmed) {
      if (currentPage === 0) {
        nextPage();
      } /* istanbul ignore else */ else if (email) {
        doCreateOrg(email);
      }
    }
  };

  const resetAndClose = () => {
    setConfirmed(false);
    setEmail('');
    setCurrentPage(0);
    handleClose();
  };
  const pages = [
    {
      heading: i18n.t('Product Terms of Use and Licenses'),
      content: (
        <>
          {clickThroughAgreement && (
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
                  label: i18n.t(
                    'I confirm I have read and agree to these product terms of use and licenses.',
                  ),
                }}
                onChange={(
                  event: React.ChangeEvent<HTMLInputElement>,
                  { checked }: { checked: boolean },
                ) => setConfirmed(checked)}
              />
            </>
          )}
        </>
      ),
    },
    {
      heading: i18n.t('Enter Your Email Address'),
      content: (
        <form
          className="slds-p-horizontal_large slds-p-bottom_large"
          onSubmit={handleConfirmSubmit}
        >
          <div className="slds-form-element__help slds-p-bottom_small slds-align_absolute-center">
            {i18n.t(
              'This email will be used as the admin of the scratch org that is created.',
            )}
          </div>
          <Input
            id="scratch-org-email"
            label={i18n.t('Email')}
            value={email}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(event.target.value)
            }
            aria-describedby="scratch-org-email"
            data-testid="scratch-org-email"
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
        <Button key="cancel" label="Cancel" onClick={resetAndClose} />,
        <Button
          key="confirm"
          label="Confirm"
          variant="brand"
          onClick={handleConfirmSubmit}
        />,
      ]}
    >
      <div className="slds-p-around_medium">{pages[currentPage].content}</div>
    </Modal>
  );
};

export default SpinOrgModal;
