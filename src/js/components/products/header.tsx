import PageHeader from '@salesforce/design-system-react/components/page-header';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';

import ProductIcon from '@/js/components/products/icon';
import { Product } from '@/js/store/products/reducer';
import { PRODUCT_LAYOUTS } from '@/js/utils/constants';

const Header = ({
  product,
  versionLabel,
}: {
  product: Product;
  versionLabel: string;
}) => {
  const { t } = useTranslation();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set focus to the header title on mount for proper focus order (WCAG 2.4.3)
    // This ensures screen readers land on the heading first, especially on iOS VoiceOver
    if (headerRef.current) {
      const heading = headerRef.current.querySelector('h1, h2, [class*="heading"]');
      if (heading && heading instanceof HTMLElement) {
        // Set tabindex to make heading focusable, then focus it
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }
  }, [product.id, versionLabel]);

  return (
    <div ref={headerRef}>
      <PageHeader
        className="page-header slds-p-around_x-large"
        title={
          product.layout === PRODUCT_LAYOUTS.Card
            ? product.title
            : t('Select a Plan')
        }
        trail={
          product.layout === PRODUCT_LAYOUTS.Card
            ? []
            : [
                <Trans i18nKey="productWithVersion" key={product.slug}>
                  {{ product: product.title }} {{ version: versionLabel }}
                </Trans>,
              ]
        }
        icon={<ProductIcon item={product} />}
        variant="object-home"
      />
    </div>
  );
};

export default Header;
