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
import type { DataCellProps } from 'components/plans/stepsTable/index';

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
    complete =
      result.find(res => res.status === RESULT_STATUS.OK) !== undefined;
    error =
      result.find(res => res.status === RESULT_STATUS.ERROR) !== undefined;
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
        <Checkbox
          id={`step-${id}`}
          className="slds-p-around_x-small"
          assistiveText={{
            label: title,
          }}
          checked
          disabled
        />
      );
    }
  } else {
    title = t('not installed');
    contents = (
      <Checkbox
        id={`step-${id}`}
        className="slds-p-around_x-small"
        assistiveText={{
          label: title,
        }}
        checked
        disabled
      />
    );
  }
  return (
    <DataTableCell title={title} {...props}>
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
    const { preflight, item, selectedSteps, user } = this.props;
    /* istanbul ignore if */
    if (!item) {
      return null;
    }
    const { id } = item;
    const hasValidToken = user && user.valid_token_for !== null;
    const hasReadyPreflight = preflight && preflight.is_ready;
    const result = preflight && preflight.results && preflight.results[id];
    let skipped, optional;
    if (result) {
      skipped = result.find(res => res.status === RESULT_STATUS.SKIP);
      optional = result.find(res => res.status === RESULT_STATUS.OPTIONAL);
    }
    const required = item.is_required && !optional;
    const recommended = !required && item.is_recommended;
    const disabled =
      Boolean(skipped) || required || !hasValidToken || !hasReadyPreflight;
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
    return (
      <DataTableCell title={title} {...this.props}>
        <Checkbox
          id={`step-${id}`}
          checked={selectedSteps && selectedSteps.has(id)}
          disabled={disabled}
          className="slds-p-vertical_x-small"
          labels={{ label }}
          assistiveText={{
            label: title,
          }}
          onChange={this.handleChange}
        />
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
