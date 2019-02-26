// @flow

import * as React from 'react';
import classNames from 'classnames';
import { t } from 'i18next';

import { CONSTANTS } from 'store/plans/reducer';
import type { Job as JobType } from 'store/jobs/reducer';

type Props = { job: JobType };
type State = {
  stepProgressPercent: number,
  completedSteps: number,
};

const DEFAULTS = {
  PROGRESS_INTERVAL: 100, // progress bar updates every [x] milliseconds
  PROGRESS_TIMER: 15 * 1000, // progress bar updates for [x] milliseconds
  PROGRESS_MAX: 0.8, // progress bar stops if step is [x] complete (out of `1`)
};

// Progress Bar has not been implemented yet in design-system-react
// https://github.com/salesforce/design-system-react/issues/1365
class ProgressBar extends React.Component<Props, State> {
  interval: ?IntervalID;

  constructor(props: Props) {
    super(props);
    this.state = {
      stepProgressPercent: 0,
      completedSteps: ProgressBar.getCompletedSteps(props.job),
    };
    this.interval = null;
  }

  componentDidMount() {
    this.startInterval();
  }

  componentWillUnmount() {
    this.clearInterval();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const { job } = this.props;
    const completedSteps = ProgressBar.getCompletedSteps(job);
    // If a step has been completed, reset perceived progress interval
    if (completedSteps !== prevState.completedSteps) {
      this.clearInterval();
      this.setState({
        stepProgressPercent: 0,
        completedSteps,
      });
      this.startInterval();
    }
  }

  // While waiting for a step to complete, show incremental progress within step
  startInterval() {
    const { job } = this.props;
    if (job.status === CONSTANTS.STATUS.STARTED) {
      this.interval = setInterval(() => {
        const { stepProgressPercent } = this.state;
        if (
          this.props.job.status === CONSTANTS.STATUS.STARTED &&
          stepProgressPercent < 100
        ) {
          const increase =
            100 / (DEFAULTS.PROGRESS_TIMER / DEFAULTS.PROGRESS_INTERVAL);
          const newPercent = Math.min(stepProgressPercent + increase, 100);
          this.setState({ stepProgressPercent: newPercent });
        } else {
          this.clearInterval();
        }
      }, DEFAULTS.PROGRESS_INTERVAL);
    }
  }

  clearInterval() {
    if (this.interval !== undefined && this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  static getCompletedSteps(job: JobType): number {
    // Get number of completed steps
    return job.steps.filter(
      step =>
        job.results[step] &&
        job.results[step].find(
          res => res.status === CONSTANTS.RESULT_STATUS.OK,
        ) !== undefined,
    ).length;
  }

  getProgress(): number {
    const { job } = this.props;
    const { stepProgressPercent, completedSteps } = this.state;
    const actualProgress = (completedSteps / job.steps.length) * 100;
    // Increment step completion, for perceived progress...
    const stepProgress =
      (1 / job.steps.length) * DEFAULTS.PROGRESS_MAX * stepProgressPercent;
    return Math.min(
      Math.round((actualProgress + stepProgress) * 100) / 100,
      100,
    );
  }

  render(): React.Node {
    const { job } = this.props;
    const isFailed =
      job.status === CONSTANTS.STATUS.FAILED ||
      job.status === CONSTANTS.STATUS.CANCELED;
    const progress = isFailed ? 100 : this.getProgress();
    const progressRounded = Math.min(Math.round(progress), 100);
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
                {progressRounded}% {t('Complete')}
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
              'slds-progress-bar__value_success':
                !isFailed && progressRounded === 100,
              'progress-bar-failed': isFailed,
            })}
            style={{ width: `${progress}%` }}
          >
            <span className="slds-assistive-text">
              {t('Progress')}: {progressRounded}%
            </span>
          </span>
        </div>
      </div>
    );
  }
}

export default ProgressBar;
