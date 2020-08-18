import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import i18n from 'i18next';
import * as React from 'react';

import { SelectedSteps } from '@/components/plans/detail';
import InstallDataCell, {
  InstallDataColumnLabel,
} from '@/components/plans/stepsTable/installDataCell';
import KindDataCell from '@/components/plans/stepsTable/kindDataCell';
import NameDataCell from '@/components/plans/stepsTable/nameDataCell';
import RequiredDataCell from '@/components/plans/stepsTable/requiredDataCell';
import ToggleLogsDataColumnLabel from '@/components/plans/stepsTable/toggleLogsDataColumnLabel';
import { Job } from '@/store/jobs/reducer';
import { CONSTANTS, Plan, Preflight, Step } from '@/store/plans/reducer';
import { User } from '@/store/user/reducer';

export type DataCellProps = {
  item?: Step;
  user?: User;
  preflight?: Preflight | null | undefined;
  className?: string;
  selectedSteps?: SelectedSteps;
  handleStepsChange?: (id: string, checked: boolean) => void;
  job?: Job;
  activeJobStep?: string | null;
};

type Props = {
  user?: User;
  plan: Plan;
  preflight?: Preflight | null | undefined;
  steps: Step[] | null;
  selectedSteps?: SelectedSteps;
  job?: Job;
  handleStepsChange?: (id: string, checked: boolean) => void;
};

type State = {
  showLogs: boolean;
  expandedPanels: Set<string>;
};

class StepsTable extends React.Component<Props, State> {
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
    const previousActiveJob = this.getActiveStep(prevProps.job);
    const currentActiveJob = this.getActiveStep(job);
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

  getActiveStep = (job?: Job): string | null => {
    // Get the currently-running step
    let activeJobStepId = null;
    if (job && this.jobIsRunning(job)) {
      for (const step of job.steps) {
        if (!job.results[step]?.status) {
          activeJobStepId = step;
          break;
        }
      }
    }
    return activeJobStepId;
  };

  jobIsRunning = (job?: Job): boolean =>
    Boolean(job?.status === CONSTANTS.STATUS.STARTED);

  jobHasLogs = (): boolean => {
    const { job } = this.props;
    let hasLogs = false;

    /* istanbul ignore if */
    if (!job) {
      return hasLogs;
    }
    for (const step of job.steps) {
      if (job.results[step]?.logs) {
        hasLogs = true;
        break;
      }
    }
    return hasLogs;
  };

  togglePanel = (id: string): void => {
    const { expandedPanels } = this.state;
    let { showLogs } = this.state;
    const { job } = this.props;
    const newPanels = new Set([...expandedPanels]);
    const activeJobStepId = this.getActiveStep(job);
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
    } else if (this.jobIsRunning(job)) {
      // Expand currently-running step-log
      const { expandedPanels } = this.state;
      const panels = new Set([...expandedPanels]);
      const activeJobStepId = this.getActiveStep(job);

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
      user,
      plan,
      preflight,
      steps,
      selectedSteps,
      job,
      handleStepsChange,
    } = this.props;
    const { expandedPanels } = this.state;
    const activeJobStepId = this.getActiveStep(job);

    const hasValidToken = Boolean(user?.valid_token_for);
    const hasReadyPreflight = !plan.requires_preflight || preflight?.is_ready;
    const logsExpanded = expandedPanels.size > 0;
    return (
      <div className="slds-p-around_medium slds-size_1-of-1">
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
                  i18n.t('Steps')
                )
              }
              property="name"
              primaryColumn
            >
              <NameDataCell
                preflight={preflight}
                job={job}
                selectedSteps={
                  hasValidToken && hasReadyPreflight ? selectedSteps : undefined
                }
                activeJobStep={activeJobStepId}
                togglePanel={this.togglePanel}
                expandedPanels={expandedPanels}
              />
            </DataTableColumn>
            <DataTableColumn key="kind" label={i18n.t('Type')} property="kind">
              <KindDataCell activeJobStep={activeJobStepId} />
            </DataTableColumn>
            <DataTableColumn key="is_required" property="is_required">
              <RequiredDataCell
                preflight={preflight}
                job={job}
                activeJobStep={activeJobStepId}
              />
            </DataTableColumn>
            {job || (hasValidToken && hasReadyPreflight) ? (
              <DataTableColumn
                key="is_recommended"
                label={job ? i18n.t('Install') : <InstallDataColumnLabel />}
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

export default StepsTable;
