// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';

import { CONSTANTS } from 'plans/reducer';

import type { Job as JobType } from 'jobs/reducer';

const JobMessage = ({
  job,
  openModal,
}: {
  job: JobType,
  openModal: () => void,
}): React.Node => (
  <>
    {job.status === CONSTANTS.STATUS.COMPLETE &&
    !job.error_count &&
    job.message ? (
      // These messages are pre-cleaned by the API
      <div dangerouslySetInnerHTML={{ __html: job.message }} />
    ) : null}
    {job.status === CONSTANTS.STATUS.FAILED ||
    job.status === CONSTANTS.STATUS.CANCELED ? (
      <p>
        <Button
          label="Share the link to this installation job"
          variant="link"
          onClick={openModal}
        />{' '}
        or get help on the{' '}
        <a
          href="https://powerofus.force.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Power of Us Hub
        </a>
        .
      </p>
    ) : null}
  </>
);

export default JobMessage;
