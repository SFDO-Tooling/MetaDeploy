// @flow

import * as React from 'react';
import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import { t } from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';
import { JobError } from 'components/plans/jobResults';
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
    let optionalMsg = '';
    let optional, logs;
    if (result) {
      hasError = result.status === RESULT_STATUS.ERROR;
      hasWarning = result.status === RESULT_STATUS.WARN;
      optional = result.status === RESULT_STATUS.OPTIONAL ? result : null;
      optionalMsg = optional && optional.message;
      logs = job ? result.logs : null;
    }
    let display = name;
    if (optionalMsg) {
      display = `${name} — ${optionalMsg}`;
    }
    display = <span className="slds-p-right_x-small">{display}</span>;
    const classes = classNames(className, {
      'has-warning': hasWarning,
      'has-error': hasError,
    });
    const errorList =
      result && (hasError || hasWarning) ? <JobError err={result} /> : null;
    const desc = description ? (
      <Tooltip
        content={description}
        id={`step-${id}-description`}
        align="top left"
        position="overflowBoundaryElement"
      >
        <a>
          <Icon
            category="utility"
            name="info_alt"
            assistiveText={{
              label: t('View Description'),
            }}
            size="x-small"
          />
        </a>
      </Tooltip>
    ) : null;
    return (
      <DataTableCell
        title={name}
        className={classNames('plan-step-item', { classes })}
        {...otherProps}
      >
        {logs ? (
          <>
            <Accordion>
              <AccordionPanel
                id={id}
                title={name}
                summary={
                  <div className="slds-cell-wrap">
                    {display}
                    {desc}
                  </div>
                }
                expanded={this.state.expanded}
                onTogglePanel={this.togglePanel}
              >
                <pre>
                  <code>{logs}</code>
                </pre>
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
              slds-cell-wrap"
          >
            <div className={errorList ? 'slds-p-bottom_small' : ''}>
              {display}
              {desc}
            </div>
            {errorList}
          </div>
        )}
      </DataTableCell>
    );
  }
}
NameDataCell.displayName = DataTableCell.displayName;

export default NameDataCell;
