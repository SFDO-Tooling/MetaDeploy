import Card from '@salesforce/design-system-react/components/card';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import ProductIcon from '@/js/components/products/icon';
import { Product } from '@/js/store/products/reducer';
import routes from '@/js/utils/routes';

const ProductItem = ({ item }: { item: Product }) => {
  const { t } = useTranslation();

  if (!item.most_recent_version) {
    return null;
  }
  const { label } = item.most_recent_version;
  return (
    <div
      className="slds-p-around_small
        slds-size_1-of-1
        slds-medium-size_1-of-2
        slds-large-size_1-of-3"
    >
      <Link
        to={routes.product_detail(item.slug)}
        className="slds-text-link_reset"
        aria-label={`${item.title} ${t('Version {{version}}', {
          version: label,
        })}`}
      >
        <Card
          heading={item.title}
          icon={<ProductIcon item={item} />}
          bodyClassName="slds-card__body_inner"
        >
          <div className="slds-text-title">
            {t('Version {{version}}', { version: label })}
          </div>
          {item.short_description ? (
            <div
              className="slds-p-top_x-small slds-text-heading_small"
              style={{ fontWeight: 300 }}
            >
              {item.short_description}
            </div>
          ) : (
            item.description && (
              <div
                className="md-truncate-children slds-text-heading_small "
                style={{ fontWeight: 300 }}
                // This description is pre-cleaned by the API
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            )
          )}
        </Card>
      </Link>
    </div>
  );
};

export default ProductItem;
