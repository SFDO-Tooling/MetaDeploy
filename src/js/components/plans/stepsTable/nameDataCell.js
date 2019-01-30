// @flow

import * as React from 'react';
import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import classNames from 'classnames';
import { Trans } from 'react-i18next';
import i18n from 'i18n';

import { CONSTANTS } from 'plans/reducer';

import { ErrorsList } from 'components/plans/jobResults';

import type { DataCellProps } from 'components/plans/stepsTable/index';

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
      <DataTableCell title={i18n.t(name)} className={classes} {...otherProps}>
        {description ? (
          <>
            <Accordion className="slds-cell-wrap">
              <AccordionPanel
                id={id}
                title={i18n.t(name)}
                summary={<p className="slds-cell-wrap">{i18n.t(display)}</p>}
                expanded={this.state.expanded}
                onTogglePanel={this.togglePanel}
              >
                {i18n.t(description)}
              </AccordionPanel>
            </Accordion>
            {errorList ? (
              <div
                className="step-name-no-icon
                  slds-p-bottom_small
                  slds-cell-wrap"
              >
                <Trans i18nKey="errorList">{errorList}</Trans>
              </div>
            ) : null}
          </>
        ) : (
          <div
            className="step-name-no-icon
              slds-p-vertical_small
              slds-cell-wrap"
          >
            <p className={errorList ? 'slds-p-bottom_small' : ''}>
              {i18n.t(display)}
            </p>
            <Trans i18nKey="errorList">{errorList}</Trans>
          </div>
        )}
      </DataTableCell>
    );
  }
}
NameDataCell.displayName = DataTableCell.displayName;

export default NameDataCell;
