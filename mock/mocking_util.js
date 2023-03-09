/* eslint-disable no-process-env */
import fetchMock from 'fetch-mock';
import { dummyData, WILDCARD } from 'mock_data';

window.dummyData = dummyData;

const MOCK_FETCH = false;
const API_URLS = window.api_urls;

// if (process?.env?.NODE_ENV === 'development') { }

/***
 * Returns an object whose key is the dummyData keys
 * and the value is a regular expression to match
 */
const _dataKeyRegExes = () => {
  let keyExps = {};
  // Generate an array of regular expression generated from the keys in dummyData.
  for (const key of Object.keys(dummyData)) {
    // creat RegEx and replace WILDCARD with random ID matching
    keyExps[key] = new RegExp("^" + key.replace(WILDCARD, "\\w+") + "$")
  }
  return keyExps;
}

const _getData = (url) => {
  for (const [key, regex] of Object.entries(_dataKeyRegExes())) {
    if (regex.test(url)) {
      return dummyData[key]
    }
  }
}


/***
 * Return data for a given URL. Agnostic because the primary key doesn't matter.
 */
const mockURLAgnosticPrimary = (url) => {
  const dataResponse = _getData(url);
  fetchMock.get(url, dataResponse);
  console.log(`Mocking "${url}`);
  console.log(dataResponse);
}

export { MOCK_FETCH, mockURLAgnosticPrimary };
