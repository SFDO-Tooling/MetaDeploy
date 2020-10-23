import Card from '@salesforce/design-system-react/components/card';
import i18n from 'i18next';
import * as React from 'react';
import { Link } from 'react-router-dom';

const PlanCard = ({
  title,
  details,
  detailUrl,
}: {
  title: string;
  details: string | null;
  detailUrl: string;
}) => (
  <Card bodyClassName="slds-card__body_inner" heading={title}>
    {details ? ( // These messages are pre-cleaned by the API
      <div
        className="markdown"
        dangerouslySetInnerHTML={{
          __html: details,
        }}
      />
    ) : null}
    <Link to={detailUrl} className="slds-button slds-button_brand">
      {i18n.t('View Plan Details')}
    </Link>
  </Card>
);

export default PlanCard;
