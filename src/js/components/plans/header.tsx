import PageHeader from '@salesforce/design-system-react/components/page-header';
import React, { ReactNode, useEffect, useRef } from 'react';
import { Trans } from 'react-i18next';

import ProductIcon from '@/js/components/products/icon';
import { Job } from '@/js/store/jobs/reducer';
import { Plan } from '@/js/store/plans/reducer';
import { Product, Version } from '@/js/store/products/reducer';

const Header = ({
  product,
  version,
  plan,
  onRenderActions,
}: {
  product: Product;
  version: Version;
  plan: Plan;
  onRenderActions?: () => ReactNode;
  job?: Job;
  userLoggedIn?: boolean;
  scratchOrgCreated?: boolean;
  preflightStatus?: string | null | undefined;
  preflightIsValid?: boolean;
  preflightIsReady?: boolean;
}) => {
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
  }, [plan.id, product.id, version.id]);

  return (
    <div ref={headerRef}>
      <PageHeader
        className="page-header slds-p-around_x-large"
        title={plan.title}
        trail={[
          <Trans i18nKey="productWithVersion" key={product.slug}>
            {{ product: product.title }} {{ version: version.label }}
          </Trans>,
        ]}
        onRenderActions={onRenderActions ? onRenderActions : null}
        icon={<ProductIcon item={product} />}
        variant="object-home"
      />
    </div>
  );
};

export default Header;
