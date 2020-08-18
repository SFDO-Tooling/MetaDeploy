import Alert from '@salesforce/design-system-react/components/alert';
import AlertContainer from '@salesforce/design-system-react/components/alert/container';
import i18n from 'i18next';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';

import { CurrentJob } from '@/store/org/reducer';
import { getDuration } from '@/utils/dates';
import routes from '@/utils/routes';

type Props = {
  currentJob: CurrentJob;
  history?: RouteComponentProps['history'];
};

class CurrentJobAlert extends React.Component<Props> {
  redirectToJob = () => {
    const { currentJob, history } = this.props;
    const { product_slug, version_label, plan_slug, id } = currentJob;
    const url = routes.job_detail(product_slug, version_label, plan_slug, id);
    if (history) {
      history.push(url);
    } else {
      window.location.assign(url);
    }
  };

  render() {
    const { currentJob } = this.props;
    const { plan_average_duration } = currentJob;
    const duration = getDuration(plan_average_duration);
    let heading = i18n.t('An installation is currently running on this org.');
    if (duration) {
      heading = `${heading} ${i18n.t('Average install time is')} ${duration}.`;
    }
    return (
      <AlertContainer className="current-job-alert">
        <Alert
          labels={{
            heading,
            headingLink: i18n.t('View installation.'),
          }}
          onClickHeadingLink={this.redirectToJob}
        />
      </AlertContainer>
    );
  }
}

export default CurrentJobAlert;
