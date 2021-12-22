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
import * as React from 'react';
import DocumentTitle from 'react-document-title';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Redirect, Route, Router, Switch } from 'react-router-dom';
import { applyMiddleware, createStore } from 'redux';
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
import { SCRATCH_ORG_QS } from '@/js/utils/constants';
import { log, logError } from '@/js/utils/logging';
import { routePatterns } from '@/js/utils/routes';
import { createSocket } from '@/js/utils/websockets';

const history = createBrowserHistory();

const App = () => (
  <DocumentTitle title={window.SITE_NAME}>
    <div className="slds-grid slds-grid_frame slds-grid_vertical">
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
  </DocumentTitle>
);

init_i18n((i18nError?: string) => {
  if (i18nError) {
    log(i18nError);
  }
  const el = document.getElementById('app');
  if (el) {
    // Remove scratch org UUID from URL
    const scratchOrgUUID = getUrlParam(SCRATCH_ORG_QS);
    if (scratchOrgUUID) {
      history.replace({ search: removeUrlParam(SCRATCH_ORG_QS) });
    }

    // Create store
    const appStore = createStore(
      reducer,
      undefined,
      composeWithDevTools(
        applyMiddleware(thunk.withExtraArgument(history), logger),
      ),
    );

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

    // Get JS globals
    let GLOBALS = {};
    try {
      const globalsEl = document.getElementById('js-globals');
      if (globalsEl?.textContent) {
        GLOBALS = JSON.parse(globalsEl.textContent);
      }
    } catch (err: any) {
      logError(err);
    }
    window.GLOBALS = GLOBALS;
    window.SITE_NAME = window.GLOBALS.SITE?.name || t('MetaDeploy');

    // Get JS context
    let JS_CONTEXT = {};
    try {
      const contextEl = document.getElementById('js-context');
      if (contextEl?.textContent) {
        JS_CONTEXT = JSON.parse(contextEl.textContent);
      }
    } catch (err: any) {
      logError(err);
    }
    window.JS_CONTEXT = JS_CONTEXT;

    // Get logged-in/out status
    const userString = el.getAttribute('data-user');
    if (userString) {
      let user;
      try {
        user = JSON.parse(userString) as User;
      } catch (err) {
        // swallow error
      }
      if (user) {
        // Login
        (appStore.dispatch as ThunkDispatch)(login(user));
      }
    }
    el.removeAttribute('data-user');

    // Set App element (used for react-SLDS modals)
    settings.setAppElement(el);

    // Fetch products before rendering App
    (appStore.dispatch as ThunkDispatch)(fetchProducts()).finally(() => {
      (appStore.dispatch as ThunkDispatch)(fetchOrgJobs());
      ReactDOM.render(
        <Provider store={appStore}>
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
        </Provider>,
        el,
      );
    });
  }
});
