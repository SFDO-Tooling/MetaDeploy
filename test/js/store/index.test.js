import { createBrowserHistory } from 'history';

import reducer from '@/store';

const history = createBrowserHistory();

describe('reducer', () => {
  test('combines child reducers', () => {
    const actual = reducer(history)(undefined, {});

    expect(Object.keys(actual)).toEqual([
      'router',
      'user',
      'products',
      'preflights',
      'jobs',
      'orgs',
      'scratchOrgs',
      'socket',
      'errors',
    ]);
  });
});
