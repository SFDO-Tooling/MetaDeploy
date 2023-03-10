import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import apiFetch from '@/js/utils/api';

const BootstrapPageData = () => {
  const { t } = useTranslation();

  const featchBootstrap = async () => {
    try {
      const response = await apiFetch(window.api_urls.ui_bootstrap(), null);
      console.log(response);
      window.GLOBALS = response;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  featchBootstrap();

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

  return (
    <>
      <Helmet>
        <title>{site_title}</title>
      </Helmet>
    </>
  );
};

export default BootstrapPageData;
