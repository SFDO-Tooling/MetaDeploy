// @flow

import * as React from 'react';
import classNames from 'classnames';
import { t } from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';
import type { Job as JobType } from 'store/jobs/reducer';

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
  const isFailed =
    job.status === CONSTANTS.STATUS.FAILED ||
    job.status === CONSTANTS.STATUS.CANCELED;
  const progress = isFailed
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
          <strong>
            {t('Installation Progress')}
            {isFailed ? (
              <>
                :{' '}
                <span className="slds-text-color_error">
                  {job.status === CONSTANTS.STATUS.CANCELED
                    ? t('Canceled')
                    : t('Failed')}
                </span>
              </>
            ) : null}
          </strong>
        </span>
        {isFailed ? null : (
          <span aria-hidden="true">
            <strong>
              {progress}% {t('Complete')}
            </strong>
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
            'slds-progress-bar__value_success': !isFailed && progress === 100,
            'progress-bar-failed': isFailed,
          })}
          style={{ width: `${progress}%` }}
        >
          <span className="slds-assistive-text">
            {t('Progress')}: {progress}%
          </span>
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
