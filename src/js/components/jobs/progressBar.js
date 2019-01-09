// @flow

import * as React from 'react';
import classNames from 'classnames';

import { CONSTANTS } from 'plans/reducer';

import type { Job as JobType } from 'jobs/reducer';

// Progress Bar has not been implemented yet in design-system-react
// https://github.com/salesforce/design-system-react/issues/1365
const ProgressBar = ({ job }: { job: JobType }): React.Node => {
  // Get array of completed steps
  const completedSteps = job.steps.filter(
    step =>
      job.results[step] &&
      job.results[step].find(
        res => res.status === CONSTANTS.RESULT_STATUS.OK,
      ) !== undefined,
  );
  const progress =
    job.status === 'failed'
      ? 100
      : Math.min(
          Math.round((completedSteps.length / job.steps.length) * 100),
          100,
        );
  const id = `${job.id}-progress`;
  return (
    <div
      className="slds-p-around_medium
        slds-size_1-of-1"
    >
      <div
        id={id}
        className="slds-grid
          slds-grid_align-spread
          slds-p-bottom_x-small
          slds-text-heading_small"
      >
        <span>
          <strong>Installation Progress</strong>
          {job.status === 'failed' ? (
            <strong className="slds-text-color_error">
              {' '}
              - Installation encountered an error.
            </strong>
          ) : null}
        </span>
        {job.status === 'failed' ? null : (
          <span aria-hidden="true">
            <strong>{progress}% Complete</strong>
          </span>
        )}
      </div>
      <div
        className="slds-progress-bar
          slds-progress-bar_large"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress}
        aria-labelledby={id}
        role="progressbar"
      >
        <span
          className={classNames('slds-progress-bar__value', {
            'slds-progress-bar__value_success':
              job.status !== 'failed' && progress === 100,
            'md-progress-bar__value_error': job.status === 'failed',
          })}
          style={{ width: `${progress}%` }}
        >
          <span className="slds-assistive-text">Progress: {progress}%</span>
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
