import React from 'react';

const Footer = () => (
  <footer
    className="slds-grid
      slds-grid--align-spread
      slds-grid_vertical-align-center
      slds-wrap
      slds-p-horizontal_x-large
      slds-p-vertical_medium
      slds-text-body_small
      site-contentinfo"
  >
    {window.GLOBALS.SITE?.show_metadeploy_wordmark ? (
      <div className="slds-text-heading_large">
        <span data-logo-bit="start">meta</span>
        <span data-logo-bit="end">deploy</span>
      </div>
    ) : (
      ''
    )}
    <div className="footer-item">
      <div
        dangerouslySetInnerHTML={{
          __html: window.GLOBALS.SITE.copyright_notice,
        }}
      />
    </div>
  </footer>
);

export default Footer;
