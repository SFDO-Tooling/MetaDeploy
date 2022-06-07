import Accordion from '@salesforce/design-system-react/components/accordion';
import AccordionPanel from '@salesforce/design-system-react/components/accordion/panel';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { JobError } from '@/js/components/plans/preflightResults';
import { DataCellProps } from '@/js/components/plans/stepsTable';
import { CONSTANTS } from '@/js/store/plans/reducer';

const { RESULT_STATUS } = CONSTANTS;

type Props = DataCellProps & {
  togglePanel: (val: string) => void;
  expandedPanels: Set<string>;
};

const NameDataCell = (props: Props) => {
  const { t } = useTranslation();
  const {
    preflight,
    job,
    item,
    className,
    selectedSteps,
    activeJobStep,
    togglePanel,
    expandedPanels,
    ...otherProps
  } = props;

  const itemId = item?.id;

  const onTogglePanel = React.useCallback(() => {
    /* istanbul ignore else */
    if (itemId) {
      togglePanel(itemId);
    }
  }, [itemId, togglePanel]);

  /* istanbul ignore if */
  if (!item) {
    return null;
  }

  const currentJob = preflight || job;
  const { name, description } = item;
  const { id } = item;
  const isActive = Boolean(activeJobStep && id === activeJobStep);
  const results = currentJob?.results?.[id] || [];
  const showErrorColors = !selectedSteps || selectedSteps.has(id);
  let hasError = false;
  let hasWarning = false;
  let optionalMsg = '';
  let optional, logs;
  for (const result of results) {
    if (result.status === RESULT_STATUS.ERROR) {
      hasError = true;
    }
    if (result.message && result.status === RESULT_STATUS.WARN) {
      hasWarning = true;
    }
    optional = result.status === RESULT_STATUS.OPTIONAL ? result : null;
    optionalMsg = optional?.message || '';
    logs = job ? result.logs : null;
  }
  let display: React.ReactNode = name;
  if (optionalMsg) {
    display = `${name} — ${optionalMsg}`;
  }
  display = <span className="slds-p-right_x-small step-label">{display}</span>;
  const classes = classNames(
    className,
    'plan-step-item',
    'plan-step-item-name',
    {
      'has-warning': hasWarning && showErrorColors,
      'has-error': hasError && showErrorColors,
      'is-installing': isActive,
    },
  );
  const errorList =
    hasError || hasWarning ? <JobError errors={results} /> : null;
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
    <DataTableCell {...otherProps} title={name} className={classes}>
      {logs ? (
        <>
          <Accordion
            className={classNames({
              'slds-p-bottom_small': Boolean(errorList),
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
              expanded={expandedPanels.has(id)}
              onTogglePanel={onTogglePanel}
            >
              <pre>
                <code dangerouslySetInnerHTML={{ __html: logs }} />
              </pre>
            </AccordionPanel>
          </Accordion>
          {errorList ? (
            <div
              className={classNames('slds-cell-wrap', 'step-name-no-icon', {
                'has-job': Boolean(job),
              })}
            >
              {errorList}
            </div>
          ) : null}
        </>
      ) : (
        <div
          className={classNames('slds-cell-wrap', 'step-name-no-icon', {
            'has-job': Boolean(job),
          })}
        >
          <div
            className={classNames({
              'slds-p-bottom_small': Boolean(errorList),
            })}
          >
            {display}
            {desc}
          </div>
          {errorList}
        </div>
      )}
    </DataTableCell>
  );
};
NameDataCell.displayName = DataTableCell.displayName;

export default NameDataCell;
