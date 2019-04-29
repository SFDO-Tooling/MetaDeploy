// @flow

import * as React from 'react';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';
import { t } from 'i18next';

import InstallDataCell, {
  InstallDataColumnLabel,
} from 'components/plans/stepsTable/installDataCell';
import KindDataCell from 'components/plans/stepsTable/kindDataCell';
import NameDataCell from 'components/plans/stepsTable/nameDataCell';
import RequiredDataCell from 'components/plans/stepsTable/requiredDataCell';
import ToggleLogsDataColumnLabel from 'components/plans/stepsTable/toggleLogsDataColumnLabel';
import { CONSTANTS } from 'store/plans/reducer';
import type { Job as JobType } from 'store/jobs/reducer';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
  Step as StepType,
} from 'store/plans/reducer';
import type { SelectedSteps as SelectedStepsType } from 'components/plans/detail';
import type { User as UserType } from 'store/user/reducer';

export type DataCellProps = {
  [string]: mixed,
  user?: UserType,
  preflight?: ?PreflightType,
  item?: StepType,
  className?: string,
  selectedSteps?: SelectedStepsType,
  handleStepsChange?: (string, boolean) => void,
  job?: JobType,
  activeJobStep?: string,
};

type Props = {
  user?: UserType,
  plan: PlanType,
  preflight?: ?PreflightType,
  selectedSteps?: SelectedStepsType,
  job?: JobType,
  handleStepsChange?: (string, boolean) => void,
};

type State = {
  expandedPanels: Set<string>,
};

class StepsTable extends React.Component<Props, State> {
  state = { expandedPanels: new Set() };

  togglePanel = (id: string) => {
    const { expandedPanels } = this.state;
    const steps = this.props.plan.steps
      ? this.props.plan.steps.map(step => step.id)
      : null;
    const newPanels = new Set([...expandedPanels]);
    const panelsAreOpen = expandedPanels.size > 0;

    if (newPanels.has(id)) {
      newPanels.delete(id);
    } else if (!panelsAreOpen && steps) {
      steps.forEach(step => newPanels.add(step).delete(id));
    } else {
      newPanels.add(id);
    }
    this.setState({ expandedPanels: newPanels });
  };

  toggleLogs = () => {
    const { expandedPanels } = this.state;
    const panelsAreOpen = expandedPanels.size > 0;
    const panels = new Set([...expandedPanels]);
    const steps = this.props.plan.steps
      ? this.props.plan.steps.map(step => step.id)
      : null;

    if (steps) {
      panelsAreOpen ? panels.clear() : steps.forEach(step => panels.add(step));
      this.setState({ expandedPanels: panels });
    } else {
      return {};
    }
  };

  render() {
    const {
      user,
      plan,
      preflight,
      selectedSteps,
      job,
      handleStepsChange,
    } = this.props;
    // Get the currently-running step
    // true if there are open panels
    const { expandedPanels } = this.state;
    let activeJobStepId;
    if (job && job.status === CONSTANTS.STATUS.STARTED) {
      for (const step of job.steps) {
        if (!(job.results[step] && job.results[step].status)) {
          activeJobStepId = step;
          break;
        }
      }
    }

    const hasValidToken = user && user.valid_token_for !== null;
    const hasReadyPreflight =
      !plan.requires_preflight || (preflight && preflight.is_ready);
    const openPanels = expandedPanels.size > 0;
    return (
      <div
        className="slds-p-around_medium
      slds-size_1-of-1"
      >
        <article className="slds-card slds-scrollable_x">
          <DataTable items={plan.steps} id="plan-steps-table">
            <DataTableColumn
              key="name"
              label={
                job ? (
                  <ToggleLogsDataColumnLabel
                    toggleLogs={this.toggleLogs}
                    hasLogs={openPanels}
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
                activeJobStep={activeJobStepId}
                togglePanel={id => this.togglePanel(id)}
                expandedPanels={this.state.expandedPanels}
              />
            </DataTableColumn>
            <DataTableColumn key="kind" label={t('Type')} property="kind">
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

export default StepsTable;
