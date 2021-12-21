import { render as renderReact } from '@testing-library/react';
import i18n, { use } from 'i18next';
import React from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

const mockStore = configureStore([]);

export const initI18n = () => {
  use(initReactI18next).init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    keySeparator: false,
    nsSeparator: false,
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false,
    },
  });
};

export const render = (ui) =>
  renderReact(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

export const rerenderWithI18n = (ui, rerender) => ({
  ...rerender(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>),
});

export const renderWithRedux = (
  ui,
  initialState = {},
  customStore = mockStore,
) => {
  const store = customStore(initialState);
  return {
    ...renderReact(
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>{ui}</Provider>
      </I18nextProvider>,
    ),
    // adding `store` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    store,
  };
};

export const reRenderWithRedux = (ui, store, rerender) => ({
  ...rerender(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>{ui}</Provider>
    </I18nextProvider>,
  ),
});

export const storeWithApi = configureStore([thunk]);
export const getStoreWithHistory = (mockHistory = { location: {} }) =>
  configureStore([thunk.withExtraArgument(mockHistory)]);
