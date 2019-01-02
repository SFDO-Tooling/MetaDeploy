import fetchMock from 'fetch-mock';

import getApiFetch, { addUrlParams } from 'utils/api';

describe('apiFetch', () => {
  const apiFetch = getApiFetch();

  test('200: returns response', () => {
    const expected = { foo: 'bar' };
    fetchMock.getOnce('/test/url/', expected);

    return expect(apiFetch('/test/url/')).resolves.toEqual(expected);
  });

  test('404: returns null', () => {
    fetchMock.getOnce('/test/url/', 404);

    return expect(apiFetch('/test/url/')).resolves.toBeNull();
  });

  test('500: throws Error', () => {
    fetchMock.getOnce('/test/url/', 500);

    expect.assertions(1);
    return expect(apiFetch('/test/url/')).rejects.toThrow();
  });

  test('network error: throws Error', () => {
    fetchMock.getOnce('/test/url/', { throws: new Error('not cool') });

    expect.assertions(1);
    return expect(apiFetch('/test/url/')).rejects.toThrow('not cool');
  });
});

describe('addUrlParams', () => {
  test('adds params to url string', () => {
    const baseUrl = `${window.location.origin}/foobar`;
    const expected = `${baseUrl}?this=that`;
    const actual = addUrlParams(baseUrl, { this: 'that' });

    return expect(actual).toBe(expected);
  });

  test('handles empty params', () => {
    const expected = `${window.location.origin}/foobar`;
    const actual = addUrlParams('/foobar');

    return expect(actual).toBe(expected);
  });
});
