import Card from '@salesforce/design-system-react/components/card';
import Pill from '@salesforce/design-system-react/components/pill';
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
      >
        <Card
          heading={item.title}
          icon={<ProductIcon item={item} />}
          bodyClassName="slds-card__body_inner"
        >
          <div className="md-product-meta slds-grid slds-wrap slds-grid_vertical-align-center">
            <span className="slds-text-title slds-m-right_small slds-p-vertical_xx-small md-product-meta-title">
              {t('Version {{version}}', { version: label })}
            </span>
            {window.GLOBALS.SITE?.show_product_tags &&
              item.tags.map((tag, idx) => (
                <span key={idx}>
                  <Pill
                    className="slds-p-around_xx-small
                      slds-m-right_small
                      md-pill-plain"
                    variant="option"
                    labels={{ label: tag }}
                  />
                </span>
              ))}
          </div>
          {item.short_description ? (
            <div className="slds-p-top_x-small">{item.short_description}</div>
          ) : (
            item.description && (
              <div
                className="md-truncate-children slds-p-top_x-small"
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
