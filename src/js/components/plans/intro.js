// @flow

import * as React from 'react';
import { t } from 'i18next';

import { getDuration } from 'utils/dates';

const Intro = ({
  averageDuration,
  results,
  cta,
  preMessage,
  postMessage,
  backLink,
}: {
  averageDuration: string | null,
  results: React.Node,
  cta: React.Node,
  preMessage?: React.Node,
  postMessage?: React.Node,
  backLink?: React.Node,
}): React.Node => {
  const duration = getDuration(averageDuration, t);
  return (
    <div
      className="slds-p-around_medium
      slds-size_1-of-1
      slds-medium-size_1-of-2"
    >
      <div className="slds-text-longform">
        {duration ? (
          <p>
            <strong>Average Install Time:</strong> {duration}.
          </p>
        ) : null}
        {preMessage}
        {results}
        {postMessage}
      </div>
      {cta}
      {backLink}
    </div>
  );
};

export default Intro;
