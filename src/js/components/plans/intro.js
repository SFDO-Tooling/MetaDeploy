// @flow

import * as React from 'react';

const Intro = ({
  results,
  cta,
  preMessage,
  postMessage,
  backLink,
}: {
  results: React.Node,
  cta: React.Node,
  preMessage?: React.Node,
  postMessage?: React.Node,
  backLink?: React.Node,
}): React.Node => (
  <div
    className="slds-p-around_medium
      slds-size_1-of-1
      slds-medium-size_1-of-2"
  >
    <div className="slds-text-longform">
      {preMessage}
      {results}
      {postMessage}
    </div>
    {cta}
    {backLink}
  </div>
);

export default Intro;
