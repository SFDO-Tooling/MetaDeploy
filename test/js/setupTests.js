import 'isomorphic-fetch';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'fetch-mock';

let location;

beforeAll(() => {
  document.createRange = () => ({
    setStart: jest.fn(),
    setEnd: jest.fn(),
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
  });
  window.api_urls = {
    account_logout: () => '/accounts/logout/',
    job_detail: (id) => `/api/jobs/${id}/`,
    job_list: () => '/api/jobs/',
    org_list: () => '/api/org/',
    plan_get_one: () => '/api/plans/get_one/',
    plan_list: () => '/api/plans/',
    plan_preflight: (id) => `/api/plans/${id}/preflight/`,
    product_get_one: () => '/api/products/get_one/',
    product_list: () => '/api/products/',
    productcategory_list: () => '/api/categories/',
    salesforce_login: () => '/accounts/salesforce/login/',
    user: () => '/api/user/',
    version_additional_plans: (id) => `/api/versions/${id}/additional_plans/`,
    version_get_one: () => '/api/versions/get_one/',
    version_list: () => '/api/versions/',
  };
  window.GLOBALS = {};
  window.SITE_NAME = 'MetaDeploy';
  window.console.error = jest.fn();
  window.console.warn = jest.fn();
  window.console.info = jest.fn();

  location = window.location;
  delete window.location;
  window.location = {
    ...location,
    assign: (href) => location.assign(href),
    reload: () => location.reload(),
  };
});

afterEach(fetchMock.reset);

afterAll(() => {
  window.location = location;
});
