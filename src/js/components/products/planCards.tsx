import Card from '@salesforce/design-system-react/components/card';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { Plan } from '@/js/store/plans/reducer';
import { Product, Version } from '@/js/store/products/reducer';
import { getVersionLabel } from '@/js/utils/helpers';
import routes from '@/js/utils/routes';

const PlanCard = ({
  productSlug,
  versionLabel,
  plan,
}: {
  productSlug: string;
  versionLabel: string;
  plan: Plan;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="slds-p-around_medium
        slds-text-heading_small
        slds-size_1-of-1
        slds-medium-size_1-of-2
        slds-large-size_1-of-3"
    >
      <Card heading={plan.title} bodyClassName="slds-card__body_inner">
        {plan.preflight_message ? (
          <div
            className="markdown"
            // These messages are pre-cleaned by the API
            dangerouslySetInnerHTML={{
              __html: plan.preflight_message,
            }}
          />
        ) : null}
        <Link
          to={routes.plan_detail(productSlug, versionLabel, plan.slug)}
          className="slds-button slds-button_brand"
        >
          {t('View Details')}
        </Link>
      </Card>
    </div>
  );
};

const PlanCards = ({
  product,
  version,
  additionalPlans,
}: {
  product: Product;
  version: Version;
  additionalPlans: Plan[];
}) => {
  const { primary_plan, secondary_plan } = version;
  const visiblePrimaryPlan =
    primary_plan?.is_listed && primary_plan?.is_allowed;
  const visibleSecondaryPlan =
    secondary_plan?.is_listed && secondary_plan?.is_allowed;

  return (
    <div className="slds-grid slds-wrap">
      {primary_plan && visiblePrimaryPlan ? (
        <PlanCard
          productSlug={product.slug}
          versionLabel={getVersionLabel(product, version)}
          plan={primary_plan}
        />
      ) : null}
      {secondary_plan && visibleSecondaryPlan ? (
        <PlanCard
          productSlug={product.slug}
          versionLabel={getVersionLabel(product, version)}
          plan={secondary_plan}
        />
      ) : null}
      {additionalPlans.map((plan) => (
        <PlanCard
          key={plan.id}
          productSlug={product.slug}
          versionLabel={getVersionLabel(product, version)}
          plan={plan}
        />
      ))}
    </div>
  );
};

export default PlanCards;
