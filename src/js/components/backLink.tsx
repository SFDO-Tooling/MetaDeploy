import Icon from '@salesforce/design-system-react/components/icon';
import UNSAFE_DirectionSettings from '@salesforce/design-system-react/components/utilities/UNSAFE_direction';
import React from 'react';
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
  <UNSAFE_DirectionSettings.Consumer>
    {(direction: string) => {
      /* istanbul ignore next */
      const name = direction === 'ltr' ? 'back' : 'forward';
      return (
        <p className={className}>
          <Link to={url}>
            <Icon
              assistiveText={{ label }}
              category="utility"
              name={name}
              size="x-small"
              className="slds-m-bottom_xxx-small"
              containerClassName="slds-m-right_xx-small slds-current-color"
            />
            {label}
          </Link>
        </p>
      );
    }}
  </UNSAFE_DirectionSettings.Consumer>
);

export default BackLink;
