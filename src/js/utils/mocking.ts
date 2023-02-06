/* eslint-disable no-process-env */
import fetchMock from 'fetch-mock';
import { dummyData } from 'mock_data';

const api_urls = window.api_urls;
let mockFetch = false;

const mockEndpoint = (
  url: fetchMock.MockMatcher | fetchMock.MockOptionsMethodGet,
  data: unknown,
) => {
  fetchMock.get(url, (url, opts) => data);
};

if (process?.env?.NODE_ENV === 'development') {
  mockFetch = true;

  // Support URLs with primary keys
  Object.entries(dummyData).forEach(([url, data]) => {
    if (url.includes('{pk}')) {
      api_urls.forEach((apiUrlFunc: { url: string }) => {
        const apiUrl = apiUrlFunc.url.replace('{pk}', '{id}');
        if (url.includes(apiUrl)) {
          mockEndpoint(apiUrlFunc, data);
        }
      });
    } else {
      mockEndpoint(url, data);
    }
  });
}

export { mockEndpoint, mockFetch, dummyData };
