/* eslint-disable no-console */
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import settings from '@salesforce/design-system-react/components/settings';
import UNSAFE_DirectionSettings from '@salesforce/design-system-react/components/utilities/UNSAFE_direction';
import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import { createBrowserHistory } from 'history';
import { t } from 'i18next';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
// Consider upgrading to v6: https://github.com/remix-run/react-router/discussions/8753
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import {
  applyMiddleware,
  // Consider upgrading to Redux Toolkit: https://github.com/reduxjs/redux/releases/tag/v4.2.0
  legacy_createStore as createStore,
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import logger from 'redux-logger';
import thunk from 'redux-thunk';

import FourOhFour from '@/js/components/404';
import AuthError from '@/js/components/authError';
import ErrorBoundary from '@/js/components/error';
import Footer from '@/js/components/footer';
import JobDetail from '@/js/components/jobs/detail';
import PlanDetail from '@/js/components/plans/detail';
import { ProductDetail, VersionDetail } from '@/js/components/products/detail';
import ProductsList from '@/js/components/products/list';
import init_i18n from '@/js/i18n';
import reducer, { ThunkDispatch } from '@/js/store';
import { fetchOrgJobs } from '@/js/store/org/actions';
import { fetchProducts } from '@/js/store/products/actions';
import { login, refetchAllData } from '@/js/store/user/actions';
import { User } from '@/js/store/user/reducer';
import { getUrlParam, removeUrlParam } from '@/js/utils/api';
import apiFetch from '@/js/utils/api';
import { SCRATCH_ORG_QS } from '@/js/utils/constants';
import { log } from '@/js/utils/logging';
import { routePatterns } from '@/js/utils/routes';
import { createSocket } from '@/js/utils/websockets';

import BootstrapPageData from './components/bootstrap/bootstrapPageData';
const history = createBrowserHistory();

console.log('>>> index.tsx');

const App = () => (
  <>
    <BootstrapPageData />
    <div className="slds-grid slds-grid_frame slds-grid_vertical metadeploy-frame">
      <ErrorBoundary>
        <div className="slds-grow slds-shrink-none">
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
  </>
);

init_i18n((i18nError?: string) => {
  if (i18nError) {
    log(i18nError);
  }
  const el = document.getElementById('app');
  console.log('>>> fetched app element');
  if (el) {
    // Remove scratch org UUID from URL
    const scratchOrgUUID = getUrlParam(SCRATCH_ORG_QS);
    if (scratchOrgUUID) {
      history.replace({ search: removeUrlParam(SCRATCH_ORG_QS) });
    }

    console.log('>>> creating app store');
    // Create store
    const appStore = createStore(
      reducer,
      undefined,
      composeWithDevTools(
        applyMiddleware(thunk.withExtraArgument(history), logger),
      ),
    );
    console.log('>>> appStore created');

    console.log('>>> connecting to websocket server');
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    window.socket = createSocket({
      url: `${protocol}//${host}${window.api_urls.ws_notifications()}`,
      dispatch: appStore.dispatch,
      options: {
        onreconnect: () => {
          (appStore.dispatch as ThunkDispatch)(refetchAllData());
        },
      },
    });
    console.log('>>> connected to websocket server');

    // Get JS globals
    let GLOBALS = {};
    console.log('>>> fetching page globals');
    const fetchBootstrap = () => {
      apiFetch(window.api_urls.ui_bootstrap(), () => {}).then((response) => {
        GLOBALS = response;
        window.GLOBALS = GLOBALS;
        window.SITE_NAME = window.GLOBALS.SITE?.name || t('MetaDeploy');
        console.log('>>> page globals loaded');
      });
    };
    fetchBootstrap();

    // Get logged-in/out status
    const featchUserInfo = () => {
      console.log('>>> fetching user info');
      apiFetch(window.api_urls.user(), () => {})
        .catch(() => {
          // Shhhh
        })
        .then((response) => {
          if (response) {
            const user = response as User;
            if (user) {
              // Login
              (appStore.dispatch as ThunkDispatch)(login(user));
            }
          }
          console.log('>>> user info loaded');
        });
    };
    featchUserInfo();

    // Set App element (used for react-SLDS modals)
    settings.setAppElement(el);
    console.log('>>> about to fetch products');
    // Fetch products before rendering App
    (appStore.dispatch as ThunkDispatch)(fetchProducts()).finally(() => {
      (appStore.dispatch as ThunkDispatch)(fetchOrgJobs());
      const root = createRoot(el);
      const helmetContext = {};
      root.render(
        <Provider store={appStore}>
          <HelmetProvider context={helmetContext}>
            <Router history={history}>
              <UNSAFE_DirectionSettings.Provider value={document.dir || 'ltr'}>
                <IconSettings
                  actionSprite={actionSprite}
                  customSprite={customSprite}
                  doctypeSprite={doctypeSprite}
                  standardSprite={standardSprite}
                  utilitySprite={utilitySprite}
                >
                  <App />
                </IconSettings>
              </UNSAFE_DirectionSettings.Provider>
            </Router>
          </HelmetProvider>
        </Provider>,
      );
    });
    console.log('>>> fetched products');
  }
});
