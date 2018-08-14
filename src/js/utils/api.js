// @flow

import cookies from 'js-cookie';

// these HTTP methods do not require CSRF protection
const csrfSafeMethod = method => /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

const getApiFetch = (onAuthFailure: () => void) => (url: string, opts: any) => {
  const options = Object.assign({}, { headers: {} }, opts);
  const method = options.method || 'GET';
  if (!csrfSafeMethod(method)) {
    options.headers['X-CSRFToken'] = cookies.get('csrftoken') || '';
  }

  return fetch(url, options)
    .then(response => {
      if (response.ok) {
        return;
      }
      if (response.status === 401) {
        onAuthFailure();
        return;
      }
      throw new Error(response.statusText);
    })
    .catch(err => {
      if (err.message === 'rejected') {
        onAuthFailure();
        return;
      }
      throw err;
    });
};

export default getApiFetch;
