import i18n from 'i18next';
import * as React from 'react';

const Footer = () => {
  let copyright = `${i18n.t('Copyright')} ${window.GLOBALS.YEAR}`;
  if (window.GLOBALS.SITE?.company_name) {
    copyright = `${copyright} ${window.GLOBALS.SITE.company_name}`;
  }
  return (
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
      {window.GLOBALS.SITE?.product_logo ? (
        <div
          className="footer-logo footer-item slds-m-right_medium slds-grow"
          style={{
            backgroundImage: `url(${window.GLOBALS.SITE.product_logo})`,
          }}
          data-testid="footer-logo"
        />
      ) : (
        <div className="slds-text-heading_large">
          <span data-logo-bit="start">meta</span>
          <span data-logo-bit="end">deploy</span>
        </div>
      )}
      <div className="footer-item slds-grid">
        {window.GLOBALS.SITE?.copyright_notice ? ( // These messages are pre-cleaned by the API
          <div
            dangerouslySetInnerHTML={{
              __html: window.GLOBALS.SITE.copyright_notice,
            }}
          />
        ) : (
          <p>{`${copyright}.`}</p>
        )}
      </div>
    </footer>
  );
};

export default Footer;
