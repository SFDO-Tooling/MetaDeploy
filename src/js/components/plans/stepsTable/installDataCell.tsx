import Checkbox from '@salesforce/design-system-react/components/checkbox';
import DataTableCell from '@salesforce/design-system-react/components/data-table/cell';
import Icon from '@salesforce/design-system-react/components/icon';
import Spinner from '@salesforce/design-system-react/components/spinner';
import Tooltip from '@salesforce/design-system-react/components/tooltip';
import classNames from 'classnames';
import i18n from 'i18next';
import * as React from 'react';

import { ErrorIcon } from '@/components/plans/preflightResults';
import { DataCellProps } from '@/components/plans/stepsTable';
import { CONSTANTS } from '@/store/plans/reducer';

const { STATUS, RESULT_STATUS } = CONSTANTS;

export const InstallDataColumnLabel = () => (
  <>
    <span title={i18n.t('Install')}>{i18n.t('Install')}</span>
    <Tooltip
      align="top right"
      content={
        <span className="step-column-tooltip">
          {i18n.t('Select steps to install.')}
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
            label: i18n.t('Learn More'),
          }}
          size="xx-small"
        />
      </a>
    </Tooltip>
  </>
);

const JobCell = (props: DataCellProps) => {
  const { item, job, activeJobStep, className, ...otherProps } = props;

  /* istanbul ignore if */
  if (!item || !job) {
    return null;
  }
  const { id } = item;
  const isActive = activeJobStep && id === activeJobStep;
  const results = job.results[id];
  let complete, error, contents, title;
  if (results) {
    for (const result of results) {
      complete = result.status === RESULT_STATUS.OK;
      error = result.status === RESULT_STATUS.ERROR;
    }
  }
  if (!job.steps.includes(id)) {
    title = i18n.t('Skipped');
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
    title = i18n.t('completed', 'Completed');
    contents = (
      <div className="is-completed">
        <Icon
          category="action"
          name="approval"
          assistiveText={{
            label: title,
          }}
          size="xx-small"
          containerClassName="slds-icon-standard-approval slds-m-left_xxx-small"
        />
      </div>
    );
  } else if (error) {
    title = i18n.t('Error');
    contents = (
      <>
        <ErrorIcon
          size="small"
          containerClassName="slds-m-left_xx-small slds-m-right_x-small"
        />
        {title}
      </>
    );
  } else if (job.status === STATUS.STARTED) {
    if (isActive) {
      title = i18n.t('installing', 'Installing');
      contents = (
        <>
          <span
            className="slds-is-relative
              slds-m-left_medium
              slds-m-right_large"
          >
            <Spinner size="small" />
          </span>
          {i18n.t('Installing…')}
        </>
      );
    } else {
      title = i18n.t('waiting to install', 'Waiting to install');
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
    title = i18n.t('not installed', 'Not installed');
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
      {...otherProps}
      title={title}
      className={classNames(className, 'plan-step-item', 'plan-step-options', {
        'is-installing': isActive,
      })}
    >
      {contents}
    </DataTableCell>
  );
};

class PreflightCell extends React.Component<DataCellProps> {
  handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    { checked }: { checked: boolean },
  ) => {
    const { item, handleStepsChange } = this.props;

    /* istanbul ignore else */
    if (handleStepsChange && item) {
      handleStepsChange(item.id, checked);
    }
  };

  render() {
    const {
      preflight,
      item,
      selectedSteps,
      className,
      ...otherProps
    } = this.props;

    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const { id } = item;
    const results = preflight?.results?.[id];
    let skipped, optional, content;
    if (results) {
      for (const result of results) {
        if (!skipped) {
          skipped = result.status === RESULT_STATUS.SKIP ? result : null;
        }
        if (!optional) {
          optional = result.status === RESULT_STATUS.OPTIONAL ? result : null;
        }
      }
    }
    const required = item.is_required && !optional;
    const recommended = !required && item.is_recommended;
    let title = i18n.t('Optional');
    if (skipped) {
      title = skipped.message || i18n.t('Skipped');
    } else if (required) {
      title = i18n.t('Required');
    } else if (recommended) {
      title = i18n.t('recommended', 'Recommended');
    }
    let label = '';
    if (skipped?.message) {
      label = skipped.message;
    } else if (recommended) {
      label = i18n.t('recommended', 'Recommended');
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
          checked={selectedSteps?.has(id)}
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
        {...otherProps}
        title={title}
        className={classNames(className, 'plan-step-item', 'plan-step-options')}
      >
        {content}
      </DataTableCell>
    );
  }
}

const InstallDataCell = (props: DataCellProps) => {
  if (props.job) {
    return <JobCell {...props} />;
  }
  return <PreflightCell {...props} />;
};
InstallDataCell.displayName = DataTableCell.displayName;

export default InstallDataCell;
