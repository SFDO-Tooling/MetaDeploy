// @flow

import * as React from 'react';
import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import { t } from 'i18next';

import routes from 'utils/routes';
import { getDuration } from 'utils/dates';
import type { CurrentJob } from 'store/org/reducer';

type Props = {
  currentJob: CurrentJob,
};

class CurrentJobAlert extends React.Component<Props> {
  redirectToJob = () => {
    const { currentJob } = this.props;
    const { product_slug, version_label, plan_slug, id } = currentJob;
    const url = routes.job_detail(product_slug, version_label, plan_slug, id);
    window.location.assign(url);
  };

  render(): React.Node {
    const { currentJob } = this.props;
    const { plan_average_duration } = currentJob;
    const duration = getDuration(plan_average_duration, t);
    let heading = t('An installation is currently running on this org.');
    if (duration) {
      heading = `${heading} ${t('Average install time is')} ${duration}.`;
    }
    return (
      <AlertContainer className="current-job-alert">
        <Alert
          labels={{
            heading,
            headingLink: t('View installation.'),
          }}
          onClickHeadingLink={this.redirectToJob}
        />
      </AlertContainer>
    );
  }
}

export default CurrentJobAlert;
