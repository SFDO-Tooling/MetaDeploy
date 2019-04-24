// @flow

import React, { Component } from 'react';
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

type State = {
  showLogs: boolean,
  expandedPanels: {},
  expanded: boolean,
};
class StepsTable extends Component<DataCellProps, State> {
  state = { showLogs: false, expandedPanels: {}, expanded: false };

  togglePanel = id => {
    this.setState(
      state => ({
        ...state,
        expandedPanels: {
          ...state.expandedPanels,
          [id]: !state.expandedPanels[id],
        },
      }),
      () => {
        if (this.state.expandedPanels.hasOwnProperty(id)) {
          console.log('match', id); //@ todo
        }
      },
    );
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
    const hasReadyPreflight = preflight && preflight.is_ready;

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
                    showLogs={this.state.showLogs}
                    toggleLogs={() =>
                      this.setState({ showLogs: !this.state.showLogs })
                    }
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
                expanded={this.state.expanded} // @todo need to set equal to a value in expandedPanels based on a matching id?
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
// const StepsTable = ({
// user,
// plan,
// preflight,
// selectedSteps,
// job,
// handleStepsChange,
// }: {
// user?: UserType,
// plan: PlanType,
// preflight?: ?PreflightType,
// selectedSteps?: SelectedStepsType,
// job?: JobType,
// handleStepsChange?: (string, boolean) => void,
// }) => {
//   // const [showLogs, toggleLogs] = useState(false);
//   // const [userSelectedStep, expandStep] = useState('');
//   // const [expanded, setExpanded] = useState(id: );

//   const setExpansion = id => {
//     // set state on the id
//     expandStep(id);
//   };
//   console.log(userSelectedStep);
// // Get the currently-running step
// let activeJobStepId;
// if (job && job.status === CONSTANTS.STATUS.STARTED) {
//   for (const step of job.steps) {
//     if (!(job.results[step] && job.results[step].status)) {
//       activeJobStepId = step;
//       break;
//     }
//   }
// }

// const hasValidToken = user && user.valid_token_for !== null;
// const hasReadyPreflight = preflight && preflight.is_ready;
// return (
//   <div
//     className="slds-p-around_medium
//     slds-size_1-of-1"
//   >
//     <article className="slds-card slds-scrollable_x">
//       <DataTable items={plan.steps} id="plan-steps-table">
//         <DataTableColumn
//           key="name"
//           label={
//             job ? (
//               <ToggleLogsDataColumnLabel
//                 showLogs={showLogs}
//                 toggleLogs={() => toggleLogs(!showLogs)}
//               />
//             ) : (
//               t('Steps')
//             )
//           }
//           property="name"
//           primaryColumn
//         >
//           <NameDataCell
//             preflight={preflight}
//             job={job}
//             activeJobStep={activeJobStepId}
//             setExpansion={id => setExpansion(id)}
//             expanded={!showLogs ? expanded : showLogs}
//           />
//         </DataTableColumn>
//         <DataTableColumn key="kind" label={t('Type')} property="kind">
//           <KindDataCell activeJobStep={activeJobStepId} />
//         </DataTableColumn>
//         <DataTableColumn key="is_required" property="is_required">
//           <RequiredDataCell
//             preflight={preflight}
//             job={job}
//             activeJobStep={activeJobStepId}
//           />
//         </DataTableColumn>
//         {job || (hasValidToken && hasReadyPreflight) ? (
//           <DataTableColumn
//             key="is_recommended"
//             label={job ? t('Install') : <InstallDataColumnLabel />}
//             property="is_recommended"
//           >
//             <InstallDataCell
//               preflight={preflight}
//               selectedSteps={selectedSteps}
//               handleStepsChange={handleStepsChange}
//               job={job}
//               activeJobStep={activeJobStepId}
//             />
//           </DataTableColumn>
//         ) : null}
//       </DataTable>
//     </article>
//   </div>
// );
// };

//export default StepsTable;
