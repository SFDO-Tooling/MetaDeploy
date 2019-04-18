// @flow

import * as React from 'react';
import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';

import { CONSTANTS } from 'store/plans/reducer';
import { ErrorsList } from 'components/plans/preflightResults';
import type { DataCellProps } from 'components/plans/stepsTable';

const { RESULT_STATUS } = CONSTANTS;

class NameDataCell extends React.Component<
  DataCellProps,
  { expanded: boolean },
> {
  constructor(props: DataCellProps) {
    super(props);
    this.state = { expanded: false };
  }

  togglePanel = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  render(): React.Node {
    const { preflight, job, item, className, ...otherProps } = this.props;
    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const currentJob = preflight || job;
    const { name, description } = item;
    const { id } = item;
    const result = currentJob && currentJob.results && currentJob.results[id];
    let hasError = false;
    let hasWarning = false;
    let optional;
    let optionalMsg = '';
    if (result) {
      hasError =
        result.find(err => err.status === RESULT_STATUS.ERROR) !== undefined;
      hasWarning =
        result.find(err => err.status === RESULT_STATUS.WARN) !== undefined;
      optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
      optionalMsg = optional && optional.message;
    }
    let display = name;
    if (optionalMsg) {
      display = `${name} — ${optionalMsg}`;
    }
    const classes = classNames(className, {
      'has-warning': hasWarning,
      'has-error': hasError,
    });
    const errorList =
      result && (hasError || hasWarning) ? (
        <ErrorsList errorList={result} />
      ) : null;
    return (
      <DataTableCell title={name} className={classes} {...otherProps}>
        {description ? (
          <>
            <Accordion className="slds-cell-wrap">
              <AccordionPanel
                id={id}
                title={name}
                summary={<p className="slds-cell-wrap">{display}</p>}
                expanded={this.state.expanded}
                onTogglePanel={this.togglePanel}
              >
                {description}
              </AccordionPanel>
            </Accordion>
            {errorList ? (
              <div
                className="step-name-no-icon
                  slds-p-bottom_small
                  slds-cell-wrap"
              >
                {errorList}
              </div>
            ) : null}
          </>
        ) : (
          <div
            className="step-name-no-icon
              slds-p-vertical_small
              slds-cell-wrap"
          >
            <p className={errorList ? 'slds-p-bottom_small' : ''}>{display}</p>
            {errorList}
          </div>
        )}
      </DataTableCell>
    );
  }
}
NameDataCell.displayName = DataTableCell.displayName;

export default NameDataCell;
