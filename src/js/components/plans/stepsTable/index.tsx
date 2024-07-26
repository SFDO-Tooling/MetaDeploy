import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import React, { Component } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';

import { SelectedSteps } from '@/js/components/plans/detail';
import InstallDataCell, {
  InstallDataColumnLabel,
} from '@/js/components/plans/stepsTable/installDataCell';
import KindDataCell from '@/js/components/plans/stepsTable/kindDataCell';
import NameDataCell from '@/js/components/plans/stepsTable/nameDataCell';
import RequiredDataCell from '@/js/components/plans/stepsTable/requiredDataCell';
import ToggleLogsDataColumnLabel from '@/js/components/plans/stepsTable/toggleLogsDataColumnLabel';
import { Job } from '@/js/store/jobs/reducer';
import { CONSTANTS, Plan, Preflight, Step } from '@/js/store/plans/reducer';

export type DataCellProps = {
  item?: Step;
  preflight?: Preflight | null | undefined;
  className?: string;
  selectedSteps?: SelectedSteps;
  handleStepsChange?: (id: string, checked: boolean) => void;
  job?: Job;
  activeJobStep?: string | null;
};

type Props = {
  plan: Plan;
  preflight?: Preflight | null | undefined;
  job?: Job;
  steps: Step[] | null;
  selectedSteps?: SelectedSteps;
  canInstall?: boolean;
  handleStepsChange?: (id: string, checked: boolean) => void;
} & WithTranslation;

type State = {
  showLogs: boolean;
  expandedPanels: Set<string>;
};

class StepsTable extends Component<Props, State> {
  state = { showLogs: false, expandedPanels: new Set<string>() };

  componentDidUpdate(prevProps: Props) {
    const { job } = this.props;
    const { showLogs, expandedPanels } = this.state;
    if (!job) {
      return;
    }
    const jobStatusChanged =
      !prevProps.job || job.status !== prevProps.job.status;
    const updates: Partial<State> = {};
    if (jobStatusChanged && showLogs) {
      // Remove auto-expand when job status changes
      updates.showLogs = false;
    }
    const previousActiveJob = StepsTable.getActiveStep(prevProps.job);
    const currentActiveJob = StepsTable.getActiveStep(job);
    const activeJobChanged = previousActiveJob !== currentActiveJob;
    if (showLogs && activeJobChanged) {
      const newPanels = new Set([...expandedPanels]);
      let changed = false;
      // Auto-collapse previously-active step

      /* istanbul ignore else */
      if (previousActiveJob && newPanels.has(previousActiveJob)) {
        changed = true;
        newPanels.delete(previousActiveJob);
      }
      // Auto-expand active step
      if (currentActiveJob) {
        changed = true;
        newPanels.add(currentActiveJob);
      }

      /* istanbul ignore else */
      if (changed) {
        updates.expandedPanels = newPanels;
      }
    }
    if (Object.keys(updates).length) {
      this.setState(updates as State);
    }
  }

  static getActiveStep = (job?: Job): string | null => {
    // Get the currently-running step
    let activeJobStepId = null;
    if (job && StepsTable.jobIsRunning(job)) {
      for (const stepId of job.steps) {
        if (StepsTable.isActiveStep(stepId, job)) {
          activeJobStepId = stepId;
          break;
        }
      }
    }
    return activeJobStepId;
  };

  /**
   * A step is considered active if either are true:
   * (1) There are no results for the step yet
   * (2) There are results but a "status" is not present.
   */
  static isActiveStep = (stepId: string, job: Job) => {
    if (!job.results[stepId]) {
      return true;
    }
    for (const result of job.results[stepId]) {
      if (!result.status) {
        return true;
      }
    }
    return false;
  };

  static jobIsRunning = (job?: Job): boolean =>
    Boolean(job?.status === CONSTANTS.STATUS.STARTED);

  jobHasLogs = (): boolean => {
    const { job } = this.props;
    let hasLogs = false;

    /* istanbul ignore if */
    if (!job) {
      return hasLogs;
    }
    for (const stepId of job.steps) {
      hasLogs = StepsTable.stepHasLogs(stepId, job);
      if (hasLogs) {
        hasLogs = true;
        break;
      }
    }
    return hasLogs;
  };

  static stepHasLogs = (stepId: string, job: Job) => {
    if (job.results[stepId]?.[0].logs) {
      return true;
    }
    return false;
  };

  togglePanel = (id: string): void => {
    const { expandedPanels } = this.state;
    let { showLogs } = this.state;
    const { job } = this.props;
    const newPanels = new Set([...expandedPanels]);
    const activeJobStepId = StepsTable.getActiveStep(job);
    if (newPanels.has(id)) {
      newPanels.delete(id);
      if (activeJobStepId && activeJobStepId === id) {
        // If currently-running step was collapsed, disable auto-expand
        showLogs = false;
      }
    } else {
      newPanels.add(id);
    }
    this.setState({ showLogs, expandedPanels: newPanels });
  };

  toggleLogs = (hide: boolean): void => {
    const { job } = this.props;

    /* istanbul ignore if */
    if (!job) {
      return;
    }
    if (hide) {
      // Collapse all step-logs
      this.setState({ showLogs: false, expandedPanels: new Set() });
    } else if (StepsTable.jobIsRunning(job)) {
      // Expand currently-running step-log
      const { expandedPanels } = this.state;
      const panels = new Set([...expandedPanels]);
      const activeJobStepId = StepsTable.getActiveStep(job);

      /* istanbul ignore else */
      if (activeJobStepId) {
        panels.add(activeJobStepId);
      }
      this.setState({ showLogs: true, expandedPanels: panels });
    } else {
      // Expand all step-logs
      this.setState({ expandedPanels: new Set([...job.steps]) });
    }
  };

  render() {
    const {
      t,
      plan,
      preflight,
      steps,
      selectedSteps,
      canInstall,
      job,
      handleStepsChange,
    } = this.props;
    const { expandedPanels } = this.state;
    const activeJobStepId = StepsTable.getActiveStep(job);

    const hasReadyPreflight = !plan.requires_preflight || preflight?.is_ready;
    const logsExpanded = expandedPanels.size > 0;
    return (
      <div className="slds-p-around_medium slds-text-heading_small slds-size_1-of-1">
        <article className="slds-card slds-scrollable_x">
          <DataTable items={steps} id="plan-steps-table">
            <DataTableColumn
              key="name"
              label={
                job ? (
                  <ToggleLogsDataColumnLabel
                    logsExpanded={logsExpanded}
                    hasLogs={this.jobHasLogs()}
                    toggleLogs={this.toggleLogs}
                  />
                ) : (
                  t('Steps')
                )
              }
              property="name"
              primaryColumn
            >
              <NameDataCell
                preflight={preflight}
                job={job}
                selectedSteps={
                  canInstall && hasReadyPreflight ? selectedSteps : undefined
                }
                activeJobStep={activeJobStepId}
                togglePanel={this.togglePanel}
                expandedPanels={expandedPanels}
              />
            </DataTableColumn>
            <DataTableColumn key="kind" label={t('Type')} property="kind">
              <KindDataCell activeJobStep={activeJobStepId} />
            </DataTableColumn>
            <DataTableColumn
              key="is_required"
              label={t('Is Required')}
              property="is_required"
            >
              <RequiredDataCell
                preflight={preflight}
                job={job}
                activeJobStep={activeJobStepId}
              />
            </DataTableColumn>
            {job || (canInstall && hasReadyPreflight) ? (
              <DataTableColumn
                key="is_recommended"
                label={job ? t('Install') : <InstallDataColumnLabel />}
                property="is_recommended"
              >
                <InstallDataCell
                  preflight={preflight}
                  selectedSteps={selectedSteps}
                  handleStepsChange={handleStepsChange}
                  job={job}
                  activeJobStep={activeJobStepId}
                />
              </DataTableColumn>
            ) : null}
          </DataTable>
        </article>
      </div>
    );
  }
}

export default withTranslation()(StepsTable);
