import * as React from 'react';

import { Job } from '@/store/jobs/reducer';
import { CONSTANTS } from '@/store/plans/reducer';

const JobMessage = ({ job }: { job: Job }) => (
  <>
    {job.status === CONSTANTS.STATUS.COMPLETE &&
    !job.error_count &&
    job.message ? ( // These messages are pre-cleaned by the API
      <div
        className="markdown"
        dangerouslySetInnerHTML={{ __html: job.message }}
      />
    ) : null}
  </>
);

export default JobMessage;
