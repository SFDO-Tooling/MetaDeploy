// @flow

import * as React from 'react';

const Footer = (props: { logoSrc: string }) => (
  <footer
    className="slds-global-footer slds-grid
   slds-grid--align-spread site-contentinfo
   slds-grid_vertical-align-center spacing-x-large"
  >
    <div className="slds-global-footer__item">
      <div
        className="slds-global-footer__logo"
        style={{ backgroundImage: `url(${props.logoSrc})` }}
      />
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
