import 'isomorphic-fetch';
import 'jest-dom/extend-expect';
import 'react-testing-library/cleanup-after-each';

beforeAll(() => {
  window.api_urls = {
    account_logout: () => '/accounts/logout/',
    salesforce_production_login: () => '/accounts/salesforce-production/login/',
    salesforce_test_login: () => '/accounts/salesforce-test/login/',
    salesforce_custom_login: () => '/accounts/salesforce-custom/login/',
    product_list: () => '/api/products/',
    version_list: () => '/api/versions/',
  };
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
});
