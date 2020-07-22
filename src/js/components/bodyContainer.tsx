import * as React from 'react';

const BodyContainer = ({
  children,
}: {
  children: React.ReactNode | null | undefined;
}) => (
  <div className="slds-p-around_medium slds-grid slds-wrap">{children}</div>
);

export default BodyContainer;
