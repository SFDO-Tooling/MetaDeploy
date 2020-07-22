import Icon from '@salesforce/design-system-react/components/icon';
import * as React from 'react';
import { Link } from 'react-router-dom';

const BackLink = ({
  label,
  url,
  className,
}: {
  label: string;
  url: string;
  className?: string;
}) => (
  <p className={className}>
    <Link to={url}>
      <Icon
        assistiveText={{ label }}
        category="utility"
        name="back"
        size="x-small"
        className="slds-m-bottom_xxx-small"
        containerClassName="slds-m-right_xx-small
        slds-current-color"
      />
      {label}
    </Link>
  </p>
);

export default BackLink;
