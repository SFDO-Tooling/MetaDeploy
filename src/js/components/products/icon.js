// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Icon from '@salesforce/design-system-react/components/icon';

import type { Product as ProductType } from 'store/products/reducer';

const ProductIcon = ({ item }: { item: ProductType }) => {
  const icon = item.icon;
  if (icon && icon.type === 'url' && icon.url) {
    // Custom icon at provided URL
    return (
      <Avatar
        variant="entity"
        label={item.title}
        imgSrc={icon.url}
        imgAlt={item.title}
        title={item.title}
      />
    );
  }
  if (icon && icon.type === 'slds' && icon.category && icon.name) {
    // Custom SLDS svg icon
    return (
      <span
        className="slds-avatar
          slds-avatar_medium"
      >
        <Icon
          assistiveText={{ label: item.title }}
          category={icon.category}
          name={icon.name}
        />
      </span>
    );
  }
  if (item.color) {
    // Standard entity icon (initials) with custom color
    return (
      <div style={{ '--custom-color': item.color }}>
        <Avatar variant="entity" label={item.title} />
      </div>
    );
  }
  // Standard entity icon (initials)
  return <Avatar variant="entity" label={item.title} />;
};

export default ProductIcon;
