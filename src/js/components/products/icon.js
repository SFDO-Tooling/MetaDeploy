// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Icon from '@salesforce/design-system-react/components/icon';

import type { Product as ProductType } from 'products/reducer';

const ProductIcon = ({ item }: { item: ProductType }) => {
  if (item.icon && item.icon.type === 'url' && item.icon.url) {
    // Custom icon at provided URL
    return (
      <Avatar
        variant="entity"
        label={item.title}
        imgSrc={item.icon.url}
        imgAlt={item.title}
        title={item.title}
      />
    );
  }
  if (
    item.icon &&
    item.icon.type === 'slds' &&
    item.icon.category &&
    item.icon.name
  ) {
    // Custom SLDS svg icon
    return (
      <span
        className="slds-avatar
          slds-avatar_medium"
      >
        <Icon
          assistiveText={{ label: item.title }}
          category={item.icon.category}
          name={item.icon.name}
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
