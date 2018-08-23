// @flow

import * as React from 'react';

const Footer = (props: { logoSrc: string }) => (
  <footer
    className="slds-grid slds-grid--align-spread
      site-contentinfo slds-grid_vertical-align-center spacing-x-large"
  >
    <div
      className="footer-logo"
      style={{ backgroundImage: `url(${props.logoSrc})` }}
      data-testid="footer-logo"
    />
    <div className="footer-item">
      <p>
        © Copyright 2018 Salesforce.com, inc.&nbsp;
        <a href="https://www.salesforce.com/company/legal/intellectual/">
          All rights reserved
        </a>
        . Various trademarks held by their respective owners.
      </p>
    </div>
  </footer>
);

export default Footer;
