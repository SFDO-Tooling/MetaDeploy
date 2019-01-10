// @flow

import * as React from 'react';
import DataTable from '@salesforce/design-system-react/components/data-table';
import DataTableColumn from '@salesforce/design-system-react/components/data-table/column';

import InstallDataCell, {
  InstallDataColumnLabel,
} from 'components/plans/stepsTable/installDataCell';
import KindDataCell from 'components/plans/stepsTable/kindDataCell';
import NameDataCell from 'components/plans/stepsTable/nameDataCell';
import RequiredDataCell from 'components/plans/stepsTable/requiredDataCell';

import { CONSTANTS } from 'plans/reducer';

import type { Job as JobType } from 'jobs/reducer';
import type {
  Plan as PlanType,
  Preflight as PreflightType,
  Step as StepType,
} from 'plans/reducer';
import type { SelectedSteps as SelectedStepsType } from 'components/plans/detail';
import type { User as UserType } from 'user/reducer';

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

const StepsTable = ({
  user,
  plan,
  preflight,
  selectedSteps,
  job,
  handleStepsChange,
}: {
  user?: UserType,
  plan: PlanType,
  preflight?: ?PreflightType,
  selectedSteps?: SelectedStepsType,
  job?: JobType,
  handleStepsChange?: (string, boolean) => void,
}) => {
  // Get the currently-running step
  let activeJobStep;
  if (job && job.status === CONSTANTS.STATUS.STARTED) {
    for (const step of job.steps) {
      if (!job.results[step]) {
        activeJobStep = step;
        break;
      }
    }
  }
  return (
    <div
      className="slds-p-around_medium
      slds-size_1-of-1"
    >
      <article className="slds-card slds-scrollable_x">
        <DataTable items={plan.steps} id="plan-steps-table">
          <DataTableColumn
            key="name"
            label="Steps"
            property="name"
            primaryColumn
          >
            <NameDataCell preflight={preflight} job={job} />
          </DataTableColumn>
          <DataTableColumn key="kind" label="Type" property="kind">
            <KindDataCell />
          </DataTableColumn>
          <DataTableColumn key="is_required" property="is_required">
            <RequiredDataCell preflight={preflight} job={job} />
          </DataTableColumn>
          <DataTableColumn
            key="is_recommended"
            label={<InstallDataColumnLabel />}
            property="is_recommended"
          >
            <InstallDataCell
              user={user}
              preflight={preflight}
              selectedSteps={selectedSteps}
              handleStepsChange={handleStepsChange}
              job={job}
              activeJobStep={activeJobStep}
            />
          </DataTableColumn>
        </DataTable>
      </article>
    </div>
  );
};

export default StepsTable;
