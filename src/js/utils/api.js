// @flow

import cookies from 'js-cookie';

// these HTTP methods do not require CSRF protection
const csrfSafeMethod = method => /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

const getResponse = resp =>
  resp.text().then(text => {
    try {
      return JSON.parse(text);
    } catch (err) {
      // swallow error
    }
    return text;
  });

const getApiFetch = (onAuthFailure: () => void) => (
  url: string,
  opts: any = {},
) => {
  const options = Object.assign({}, { headers: {} }, opts);
  const method = options.method || 'GET';
  if (!csrfSafeMethod(method)) {
    options.headers['X-CSRFToken'] = cookies.get('csrftoken') || '';
  }

  return fetch(url, options)
    .then(response => {
      if (response.ok) {
        return getResponse(response);
      }
      if (response.status === 401) {
        onAuthFailure();
        return getResponse(response);
      }
      const error = (new Error(response.statusText): any);
      error.response = response;
      throw error;
    })
    .catch(err => {
      throw err;
    });
};

export default getApiFetch;
