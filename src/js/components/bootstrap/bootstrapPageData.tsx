import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

const BootstrapPageData = () => {
  const { t, i18n } = useTranslation();
  // Setting language direction
  document.dir = i18n.dir();
  /*
  {
    "PREFLIGHT_LIFETIME_MINUTES":60,
    "TOKEN_LIFETIME_MINUTES":60,
    "SITE":{
      "name":"Main Name",
      "company_name":"Company Name",
      "welcome_text":"<p>hi</p>",
      "master_agreement":"",
      "copyright_notice":"<p>Copyright notice <a href=\"#\">Link Teest</a></p>",
      "show_metadeploy_wordmark":true,
      "company_logo":null,
      "favicon":null
    },
    "YEAR":2023,
    "SENTRY_DSN":"",
    "SCRATCH_ORGS_AVAILABLE":true
  }
  */
  const GLOBALS = window.GLOBALS;
  return (
    <>
      <Helmet>
        <title>{window.SITE_NAME}</title>
        <meta name="author" content={GLOBALS?.SITE.company_name} />
        <meta name="keywords" content="" />
        <link rel="shortcut icon" href={GLOBALS?.SITE.favicon} />
        <meta
          name="description"
          content="Web-based tool for installing Salesforce products"
        />
      </Helmet>
    </>
  );
};

export default BootstrapPageData;
