// @flow

import * as React from 'react';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import { t } from 'i18next';

import { CONSTANTS } from 'plans/reducer';
import type { DataCellProps } from 'components/plans/stepsTable/index';

const { RESULT_STATUS } = CONSTANTS;

const RequiredDataCell = (props: DataCellProps): React.Node => {
  const { preflight, item, job } = props;
  /* istanbul ignore if */
  if (!item) {
    return null;
  }
  const { id } = item;
  const result = preflight && preflight.results && preflight.results[id];
  let skipped, optional;
  if (result) {
    skipped = result.find(res => res.status === RESULT_STATUS.SKIP);
    optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
  }
  const required =
    item.is_required && !optional && (!job || job.steps.includes(id));
  const classes = classNames(
    'slds-align-middle',
    'slds-badge',
    'slds-m-horizontal_large',
    { 'slds-badge_inverse': !required },
  );
  let text = t('Optional');
  if (skipped) {
    text = t('Skipped');
  } else if (required) {
    text = t('Required');
  }
  return (
    <DataTableCell title={text} {...props}>
      <span className={classes}>{text}</span>
    </DataTableCell>
  );
};
RequiredDataCell.displayName = DataTableCell.displayName;

export default RequiredDataCell;
