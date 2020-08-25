import Button from '@salesforce/design-system-react/components/button';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import Modal from '@salesforce/design-system-react/components/modal';
import i18n from 'i18next';
import React, { useState } from 'react';

type Props = {
  isOpen: boolean;
  clickThroughAgreement: string | null;
  handleClose: () => void;
  createOrg: (email: string) => void;
};

const SpinOrgModal = ({
  isOpen,
  clickThroughAgreement,
  handleClose,
  createOrg,
}: Props) => {
  const [confirmed, setConfirmed] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    setConfirmed(checked);
  };

  const nextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const handleConfirm = () => {
    const email = 'erica@oddbird.net';
    if (confirmed) {
      if (currentPage === 0) {
        nextPage();
      } else if (email) {
        createOrg(email);
      }
    }
  };

  const pages = [
    {
      heading: i18n.t('Product Terms of Use and Licenses'),
      contents: (
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
                onChange={handleChange}
              />
            </>
          )}
        </>
      ),
    },
    {
      heading: i18n.t('Enter Your Email Address'),
      content: <div>content here</div>, // todo add form for email, call confrim with email address and pass as callback to Intro component
    },
  ];
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      size="medium"
      heading={pages[currentPage].heading}
      footer={[
        <Button key="cancel" label="Cancel" onClick={handleClose} />,
        <Button
          key="confirm"
          label="Confirm"
          variant="brand"
          onClick={handleConfirm}
        />,
      ]}
    >
      <div className="slds-p-around_medium">{pages[currentPage].contents}</div>
    </Modal>
  );
};

export default SpinOrgModal;
