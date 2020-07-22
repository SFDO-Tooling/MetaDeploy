import Card from '@salesforce/design-system-react/components/card';
import i18n from 'i18next';
import * as React from 'react';
import { Link } from 'react-router-dom';

import ProductIcon from '@/components/products/icon';
import type { Product as ProductType } from '@/store/products/reducer';
import routes from '@/utils/routes';

const ProductItem = ({ item }: { item: ProductType }) => {
  if (!item.most_recent_version) {
    return null;
  }
  const { label } = item.most_recent_version;
  return (
    <Link
      to={routes.product_detail(item.slug)}
      className="slds-text-link_reset
        slds-p-around_small
        slds-size_1-of-1
        slds-medium-size_1-of-2
        slds-large-size_1-of-3"
    >
      <Card
        heading={item.title}
        icon={<ProductIcon item={item} />}
        bodyClassName="slds-card__body_inner"
      >
        <div className="slds-text-title">
          {i18n.t('Version')} {label}
        </div>
        {item.short_description ? (
          <div className="slds-p-top_x-small">{item.short_description}</div>
        ) : (
          <div
            className="md-truncate-children slds-p-top_x-small"
            // This description is pre-cleaned by the API
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        )}
      </Card>
    </Link>
  );
};

export default ProductItem;
