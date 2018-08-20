import fetchMock from 'fetch-mock';

import getApiFetch from 'utils/api';

describe('apiFetch', () => {
  const apiFetch = getApiFetch();

  afterEach(fetchMock.restore);

  test('200: returns response', () => {
    const expected = { foo: 'bar' };
    fetchMock.getOnce('/test/url/', expected);

    return expect(apiFetch('/test/url/')).resolves.toEqual(expected);
  });

  test('401: calls onAuthFailure', () => {
    const onAuthFailure = jest.fn();
    const apiFetchWithFailure = getApiFetch(onAuthFailure);

    fetchMock.getOnce('/test/url/', { status: 401, body: 'Unauthorized' });

    return apiFetchWithFailure('/test/url/').then(resp => {
      expect(resp).toEqual('Unauthorized');
      expect(onAuthFailure).toHaveBeenCalled();
    });
  });

  test('500: throws Error', () => {
    fetchMock.getOnce('/test/url/', 500);

    expect.assertions(1);
    return expect(apiFetch('/test/url/')).rejects.toThrow();
  });

  test('network error: throws Error', () => {
    fetchMock.getOnce('/test/url/', { throws: 'not cool' });

    expect.assertions(1);
    return expect(() => {
      apiFetch('/test/url/');
    }).toThrow('not cool');
  });
});
