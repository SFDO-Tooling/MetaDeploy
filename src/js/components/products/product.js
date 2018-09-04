// @flow

import * as React from 'react';
import Avatar from '@salesforce/design-system-react/components/avatar';
import Card from '@salesforce/design-system-react/components/card';
import Icon from '@salesforce/design-system-react/components/icon';
import { Link } from 'react-router-dom';

import routes from 'utils/routes';

import type { Product as ProductType } from 'products/reducer';

class ProductItem extends React.Component<{
  item: ProductType,
}> {
  getIcon(): React.Node {
    const { item } = this.props;
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
  }

  render(): React.Node {
    const { item } = this.props;
    const icon = this.getIcon();
    return (
      <Link
        to={routes.product_detail(item.id)}
        className="slds-text-link_reset
          slds-p-around_small
          slds-size_1-of-1
          slds-medium-size_1-of-2
          slds-large-size_1-of-3"
      >
        <Card heading={item.title} icon={icon}>
          <div className="slds-card__body_inner">
            <div className="slds-text-title">Version {item.version}</div>
            <p className="slds-truncate">{item.description}</p>
          </div>
        </Card>
      </Link>
    );
  }
}

export default ProductItem;
