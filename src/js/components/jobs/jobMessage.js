// @flow

import * as React from 'react';
import Button from '@salesforce/design-system-react/components/button';
import { Trans } from 'react-i18next';
import { t } from 'i18next';

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
          label={t('Share the link to this installation job')}
          variant="link"
          onClick={openModal}
        />{' '}
        <Trans i18nKey="shareOrGetHelp">
          or get help on the{' '}
          <a
            href="https://powerofus.force.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Power of Us Hub
          </a>
          .
        </Trans>
      </p>
    ) : null}
  </>
);

export default JobMessage;
