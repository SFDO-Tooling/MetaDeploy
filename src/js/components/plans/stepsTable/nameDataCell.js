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
import { JobError } from 'components/plans/preflightResults';
import type { DataCellProps } from 'components/plans/stepsTable';

const { RESULT_STATUS } = CONSTANTS;

type Props = {
  expandedPanels: Set<string>,
  autoExpanded: boolean,
  togglePanel: (val: string) => void,
} & DataCellProps;

class NameDataCell extends React.Component<Props> {
  togglePanel = () => {
    const { item } = this.props;
    if (!item) {
      return;
    }
    this.props.togglePanel(item.id);
  };

  render(): React.Node {
    const {
      preflight,
      job,
      item,
      className,
      activeJobStep,
      expandedPanels,
      autoExpanded,
      ...otherProps
    } = this.props;
    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const currentJob = preflight || job;
    const { name, description } = item;
    const { id } = item;
    const isActive = activeJobStep && id === activeJobStep;
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
    display = (
      <span className="slds-p-right_x-small step-label">{display}</span>
    );
    const classes = classNames(
      className,
      'plan-step-item',
      'plan-step-item-name',
      {
        'has-warning': hasWarning,
        'has-error': hasError,
        'is-installing': isActive,
      },
    );
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
      <DataTableCell title={name} className={classes} {...otherProps}>
        {logs ? (
          <>
            <Accordion
              className={classNames({
                'slds-p-bottom_small': errorList,
              })}
            >
              <AccordionPanel
                id={id}
                title={name}
                summary={
                  <div className="slds-cell-wrap plan-step-name">
                    {display}
                    {desc}
                  </div>
                }
                expanded={expandedPanels.has(id) || autoExpanded || isActive}
                onTogglePanel={this.togglePanel}
              >
                <pre>
                  <code>{logs}</code>
                </pre>
              </AccordionPanel>
            </Accordion>
            {errorList ? (
              <div
                className={classNames('slds-cell-wrap', 'step-name-no-icon', {
                  'has-job': job,
                })}
              >
                {errorList}
              </div>
            ) : null}
          </>
        ) : (
          <div
            className={classNames('slds-cell-wrap', 'step-name-no-icon', {
              'has-job': job,
            })}
          >
            <div className={classNames({ 'slds-p-bottom_small': errorList })}>
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
