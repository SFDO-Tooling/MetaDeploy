// @flow

import * as React from 'react';

import { CONSTANTS } from 'store/plans/reducer';
import type { Job as JobType } from 'store/jobs/reducer';

const JobMessage = ({ job }: { job: JobType }): React.Node => (
  <>
    {job.status === CONSTANTS.STATUS.COMPLETE &&
    !job.error_count &&
    job.message ? (
      // These messages are pre-cleaned by the API
      <div
        className="markdown"
        dangerouslySetInnerHTML={{ __html: job.message }}
      />
    ) : null}
  </>
);

export default JobMessage;
