// @flow

import * as React from 'react';
import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import Spinner from '@salesforce/design-system-react/components/spinner';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import { t } from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';
import { ErrorIcon } from 'components/plans/jobResults';
import type { DataCellProps } from 'components/plans/stepsTable';

const { STATUS, RESULT_STATUS } = CONSTANTS;

export const InstallDataColumnLabel = (): React.Node => (
  <>
    <span title={t('Install')}>{t('Install')}</span>
    <Tooltip
      align="top right"
      content={
        <span className="step-column-tooltip">
          {t('Select steps to install.')}
        </span>
      }
      triggerClassName="slds-p-left_x-small"
      position="overflowBoundaryElement"
    >
      <a>
        <Icon
          category="utility"
          name="info"
          assistiveText={{
            label: t('Learn More'),
          }}
          size="xx-small"
        />
      </a>
    </Tooltip>
  </>
);

const JobCell = (props: DataCellProps): React.Node => {
  const { item, job, activeJobStep } = props;
  /* istanbul ignore if */
  if (!item || !job) {
    return null;
  }
  const { id } = item;
  const result = job.results[id];
  let complete, error, contents, title;
  if (result) {
    complete = result.status === RESULT_STATUS.OK;
    error = result.status === RESULT_STATUS.ERROR;
  }
  if (!job.steps.includes(id)) {
    title = t('skipped');
    contents = (
      <Icon
        category="utility"
        name="dash"
        assistiveText={{
          label: title,
        }}
        size="x-small"
        colorVariant="light"
        className="slds-m-horizontal_x-small"
      />
    );
  } else if (complete) {
    title = t('completed');
    contents = (
      <div className="is-completed">
        <Icon
          category="action"
          name="approval"
          assistiveText={{
            label: title,
          }}
          size="xx-small"
          containerClassName="slds-icon-standard-approval
            slds-m-left_xxx-small"
        />
      </div>
    );
  } else if (error) {
    title = t('error');
    contents = (
      <>
        <ErrorIcon
          size="small"
          containerClassName="slds-m-left_xx-small
            slds-m-right_x-small"
        />
        {title}
      </>
    );
  } else if (job.status === STATUS.STARTED) {
    if (activeJobStep && id === activeJobStep) {
      title = t('installing');
      contents = (
        <>
          <span
            className="slds-is-relative
              slds-m-left_medium
              slds-m-right_large"
          >
            <Spinner size="small" />
          </span>
          {t('Installing…')}
        </>
      );
    } else {
      title = t('waiting to install');
      contents = (
        <Icon
          category="utility"
          name="check"
          assistiveText={{
            label: title,
          }}
          size="x-small"
          colorVariant="light"
          className="slds-m-horizontal_x-small"
        />
      );
    }
  } else {
    title = t('not installed');
    contents = (
      <Icon
        category="utility"
        name="dash"
        assistiveText={{
          label: title,
        }}
        size="x-small"
        colorVariant="light"
        className="slds-m-horizontal_x-small"
      />
    );
  }
  return (
    <DataTableCell
      title={title}
      {...props}
      className="plan-step-item plan-step-options"
    >
      {contents}
    </DataTableCell>
  );
};

class PreflightCell extends React.Component<DataCellProps> {
  handleChange = (
    event: SyntheticInputEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    const { item, handleStepsChange } = this.props;
    /* istanbul ignore else */
    if (handleStepsChange && item) {
      handleStepsChange(item.id, checked);
    }
  };

  render(): React.Node {
    const { preflight, item, selectedSteps } = this.props;
    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const { id } = item;
    const result = preflight && preflight.results && preflight.results[id];
    let skipped, optional, content;
    if (result) {
      skipped = result.status === RESULT_STATUS.SKIP ? result : null;
      optional = result.status === RESULT_STATUS.OPTIONAL ? result : null;
    }
    const required = item.is_required && !optional;
    const recommended = !required && item.is_recommended;
    let title = t('optional');
    if (skipped) {
      title = skipped.message || t('skipped');
    } else if (required) {
      title = t('required');
    } else if (recommended) {
      title = t('recommended');
    }
    let label = '';
    if (skipped && skipped.message) {
      label = skipped.message;
    } else if (recommended) {
      label = t('recommended');
    }
    if (skipped || required) {
      content = (
        <Icon
          category="utility"
          name={skipped ? 'dash' : 'check'}
          assistiveText={{
            label: title,
          }}
          size="x-small"
          colorVariant="light"
        />
      );
    } else {
      content = (
        <Checkbox
          id={`step-${id}`}
          checked={selectedSteps && selectedSteps.has(id)}
          labels={{ label }}
          assistiveText={{
            label: title,
          }}
          onChange={this.handleChange}
        />
      );
    }
    return (
      <DataTableCell
        title={title}
        {...this.props}
        className="plan-step-item plan-step-options"
      >
        {content}
      </DataTableCell>
    );
  }
}

const InstallDataCell = (props: DataCellProps): React.Node => {
  if (props.job) {
    return <JobCell {...props} />;
  }
  return <PreflightCell {...props} />;
};
InstallDataCell.displayName = DataTableCell.displayName;

export default InstallDataCell;
