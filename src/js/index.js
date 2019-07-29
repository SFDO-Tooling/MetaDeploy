// @flow

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import i18n from 'i18next';
import logger from 'redux-logger';
import settings from '@salesforce/design-system-react/components/settings';
import thunk from 'redux-thunk';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';

import init_i18n from './i18n';

import { createSocket } from 'utils/websockets';
import { log, logError } from 'utils/logging';
import { routePatterns } from 'utils/routes';
import reducer from 'store';
import { login, refetchAllData } from 'store/user/actions';
import { fetchProducts } from 'store/products/actions';
import AuthError from 'components/authError';
import ErrorBoundary from 'components/error';
import Footer from 'components/footer';
import FourOhFour from 'components/404';
import JobDetail from 'components/jobs/detail';
import PlanDetail from 'components/plans/detail';
import ProductsList from 'components/products/list';
import { ProductDetail, VersionDetail } from 'components/products/detail';

const App = () => (
  <DocumentTitle title={window.SITE_NAME}>
    <div
      className="slds-grid
        slds-grid_frame
        slds-grid_vertical"
    >
      <ErrorBoundary>
        <div
          className="slds-grow
            slds-shrink-none"
        >
          <ErrorBoundary>
            <Switch>
              <Route
                exact
                path={routePatterns.home()}
                render={() => <Redirect to={routePatterns.product_list()} />}
              />
              <Route
                exact
                path={routePatterns.product_list()}
                component={ProductsList}
              />
              <Route
                exact
                path={routePatterns.product_detail()}
                component={ProductDetail}
              />
              <Route
                exact
                path={routePatterns.version_detail()}
                component={VersionDetail}
              />
              <Route
                exact
                path={routePatterns.plan_detail()}
                component={PlanDetail}
              />
              <Route
                exact
                path={routePatterns.job_detail()}
                component={JobDetail}
              />
              <Route path={routePatterns.auth_error()} component={AuthError} />
              <Route component={FourOhFour} />
            </Switch>
          </ErrorBoundary>
        </div>
        <Footer />
      </ErrorBoundary>
    </div>
  </DocumentTitle>
);

init_i18n(i18nError => {
  if (i18nError) {
    log(i18nError);
  }
  const el = document.getElementById('app');
  if (el) {
    // Create store
    const appStore = createStore(
      reducer,
      {},
      composeWithDevTools(applyMiddleware(thunk, logger)),
    );

    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    window.socket = createSocket({
      url: `${protocol}//${host}${window.api_urls.ws_notifications()}`,
      dispatch: appStore.dispatch,
      options: {
        onreconnect: () => {
          appStore.dispatch(refetchAllData());
        },
      },
    });

    // Get JS globals
    let GLOBALS = {};
    try {
      const globalsEl = document.getElementById('js-globals');
      if (globalsEl) {
        GLOBALS = JSON.parse(globalsEl.textContent);
      }
    } catch (err) {
      logError(err);
    }
    window.GLOBALS = GLOBALS;
    window.SITE_NAME =
      (window.GLOBALS.SITE && window.GLOBALS.SITE.name) || i18n.t('MetaDeploy');

    // Get logged-in/out status
    const userString = el.getAttribute('data-user');
    if (userString) {
      let user;
      try {
        user = JSON.parse(userString);
      } catch (err) {
        // swallow error
      }
      if (user) {
        // Login
        appStore.dispatch(login(user));
      }
    }
    el.removeAttribute('data-user');

    // Set App element (used for react-SLDS modals)
    settings.setAppElement(el);

    // Fetch products before rendering App
    appStore.dispatch(fetchProducts()).finally(() => {
      ReactDOM.render(
        <Provider store={appStore}>
          <BrowserRouter>
            <IconSettings
              actionSprite={actionSprite}
              customSprite={customSprite}
              doctypeSprite={doctypeSprite}
              standardSprite={standardSprite}
              utilitySprite={utilitySprite}
            >
              <App />
            </IconSettings>
          </BrowserRouter>
        </Provider>,
        el,
      );
    });
  }
});
