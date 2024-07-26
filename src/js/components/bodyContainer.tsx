import React, { ReactNode } from 'react';

const BodyContainer = ({
  children,
}: {
  children: ReactNode | null | undefined;
}) => (
  <div className="slds-p-around_medium slds-text-heading_small slds-grid slds-wrap">
    {children}
  </div>
);

export default BodyContainer;
