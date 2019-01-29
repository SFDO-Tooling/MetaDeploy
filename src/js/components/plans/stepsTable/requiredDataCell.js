// @flow

import * as React from 'react';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import * as i18n from 'i18next';

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
  let text = 'Optional';
  if (skipped) {
    text = 'Skipped';
  } else if (required) {
    text = 'Required';
  }
  return (
    <DataTableCell title={i18n.t(text)} {...props}>
      <span className={classes}>{i18n.t(text)}</span>
    </DataTableCell>
  );
};
RequiredDataCell.displayName = DataTableCell.displayName;

export default RequiredDataCell;
