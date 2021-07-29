import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import i18n from 'i18next';
import * as React from 'react';

import { DataCellProps } from '@/js/components/plans/stepsTable';
import { CONSTANTS } from '@/js/store/plans/reducer';

const { RESULT_STATUS } = CONSTANTS;

const RequiredDataCell = (props: DataCellProps) => {
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
  let text = i18n.t('Optional');
  if (skipped) {
    text = i18n.t('Skipped');
  } else if (required) {
    text = i18n.t('Required');
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
