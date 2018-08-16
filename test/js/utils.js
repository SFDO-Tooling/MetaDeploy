import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { render } from 'react-testing-library';

export const renderWithRedux = (
  ui,
  { initialState, reducer, store = createStore(reducer, initialState) } = {},
) => ({
  ...render(<Provider store={store}>{ui}</Provider>),
  // adding `store` to the returned utilities to allow us
  // to reference it in our tests (just try to avoid using
  // this to test implementation details).
  store,
});
