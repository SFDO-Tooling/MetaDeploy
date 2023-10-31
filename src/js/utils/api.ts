import cookies from 'js-cookie';
import { useTranslation } from 'react-i18next';
import { ThunkDispatch } from 'redux-thunk';

import { addError } from '@/js/store/errors/actions';
import { logError } from '@/js/utils/logging';

export type UrlParams = {
  [key: string]: string | number | boolean;
};

export class ApiError extends Error {
  response?: Response;

  body?: string | { [key: string]: any };
}

// these HTTP methods do not require CSRF protection
const csrfSafeMethod = (method: string) =>
  /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

const getResponse = (resp: Response): Promise<any> =>
  resp
    .text()
    .then((text) => {
      try {
        return { response: resp, body: JSON.parse(text) };
      } catch (err) {
        // swallow error
      }
      return { response: resp, body: text };
    })
    .catch(
      /* istanbul ignore next */
      (err) => {
        logError(err);
        throw err;
      },
    );

const apiFetch = (
  url: string,
  dispatch: ThunkDispatch<any, any, any>,
  opts: {
    [key: string]: any;
  } = {},
  suppressErrorsOn: number[] = [404],
): Promise<any> => {
  const options = Object.assign({}, { headers: {} }, opts);
  const method = options.method || 'GET';
  if (!csrfSafeMethod(method)) {
    (options.headers as { [key: string]: any })['X-CSRFToken'] =
      cookies.get('csrftoken') || '';
  }

  return fetch(url, options)
    .then(getResponse)
    .then(
      ({ response, body }) => {
        if (response.ok) {
          return body;
        }
        if (suppressErrorsOn.includes(response.status)) {
          return null;
        }
        let msg = response.statusText;
        if (body) {
          if (typeof body === 'string') {
            msg = body;
          } else if (body.detail) {
            msg = body.detail;
          } else if (body.non_field_errors) {
            msg = body.non_field_errors;
          }
        }
        if (response.status > 500 && response.status <= 600) {
          msg = 'Something went wrong. Please try again later.';
        }
        dispatch(addError(msg));
        const error: ApiError = new Error(msg);
        error.response = response;
        throw error;
      },
      (err) => {
        logError(err);
        throw err;
      },
    )
    .catch((err) => {
      logError(err);
      throw err;
    });
};

// Based on https://fetch.spec.whatwg.org/#fetch-api
export const addUrlParams = (
  baseUrl: string,
  params: UrlParams = {},
  includeOrigin = false,
): string => {
  const url = new URL(baseUrl, window.location.origin);
  Object.keys(params).forEach((key) => {
    const value = params[key].toString();
    // Disallow duplicate params with the same key:value
    if (url.searchParams.get(key) !== value) {
      url.searchParams.append(key, value);
    }
  });
  if (includeOrigin) {
    return url.href;
  }
  return url.pathname + url.search + url.hash;
};

export const getUrlParam = (key: string, search?: string): string | null =>
  new URLSearchParams(search || window.location.search).get(key);

export const removeUrlParam = (key: string, search?: string): string => {
  const params = new URLSearchParams(search || window.location.search);
  // This deletes _all_ occurences of the given key
  params.delete(key);
  return params.toString();
};

export const extractCustomDomain = (url: string): string => {
  const protocol = /(http(s?)):\/\//;
  const domain = /(\.sandbox)?\.my\.salesforce\.com(\/?)/;
  return url.replace(protocol, '').replace(domain, '');
};

export default apiFetch;
