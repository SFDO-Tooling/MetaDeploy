import React from 'react';

import BootstrapPageData from '@/js/components/bootstrap/bootstrapPageData';

import { render } from './../utils';

const GLOBALS = {
  PREFLIGHT_LIFETIME_MINUTES: 60,
  TOKEN_LIFETIME_MINUTES: 60,
  SITE: {
    name: 'Default MetaDeploy Name',
    company_name: 'Default MetaDeploy Company Name',
    welcome_text:
      '<p>Thank you for visiting MetaDeploy. This is the default Welcome Text.</p>',
    master_agreement: '<p>This is the default Master Agreement.</p>',
    copyright_notice: '<p>Copyright notice <a href="#">Link Test</a></p>',
    show_metadeploy_wordmark: true,
    company_logo: null,
    favicon: 'http://localhost/images/test.png',
  },
  YEAR: 2023,
  SENTRY_DSN: '',
  SCRATCH_ORGS_AVAILABLE: true,
};

describe('<BootstrapPageData />', () => {
  describe('meta', () => {
    beforeAll(() => {
      window.GLOBALS = GLOBALS;
      window.SITE_NAME = window.GLOBALS.SITE.name;
    });

    afterAll(() => {
      window.GLOBALS = {};
    });

    test('renders meta', () => {
      render(<BootstrapPageData />);
      expect(document.querySelector("meta[name='author']").content).toBe(
        GLOBALS.SITE.company_name,
      );
      expect(document.querySelector("link[rel='shortcut icon']").href).toBe(
        GLOBALS.SITE.favicon,
      );
      expect(document.querySelector('title').text).toBe(window.SITE_NAME);
    });
  });
});
