import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DataCellProps } from '@/js/components/plans/stepsTable';
import { CONSTANTS } from '@/js/store/plans/reducer';

const { RESULT_STATUS } = CONSTANTS;

const RequiredDataCell = (props: DataCellProps) => {
  const { t } = useTranslation();
  const { preflight, item, job, className, activeJobStep, ...otherProps } =
    props;

  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { id } = item;
  const isActive = activeJobStep && id === activeJobStep;

  const results = preflight?.results?.[id] || [];
  const skipped = results.some(
    (result) => result.status === RESULT_STATUS.SKIP,
  );
  const optional = results.some(
    (result) => result.status === RESULT_STATUS.OPTIONAL,
  );

  const required =
    item.is_required && !optional && (!job || job.steps.includes(id));
  const classes = classNames('slds-align-middle', 'slds-badge', {
    'slds-badge_lightest': !required,
  });
  let text = t('Optional');
  if (skipped) {
    text = t('Skipped');
  } else if (required) {
    text = t('Required');
  }
  return (
    <DataTableCell
      {...otherProps}
      title={text}
      className={classNames(
        className,
        'plan-step-item',
        'plan-step-badge-container',
        {
          'is-installing': isActive,
        },
      )}
    >
      <span className={classes}>{text}</span>
    </DataTableCell>
  );
};
RequiredDataCell.displayName = DataTableCell.displayName;

export default RequiredDataCell;
