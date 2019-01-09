// @flow

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import logger from 'redux-logger';
import settings from '@salesforce/design-system-react/components/settings';
import thunk from 'redux-thunk';
import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createStore, applyMiddleware } from 'redux';

import actionSprite from '@salesforce-ux/design-system/assets/icons/action-sprite/svg/symbols.svg';
import customSprite from '@salesforce-ux/design-system/assets/icons/custom-sprite/svg/symbols.svg';
import doctypeSprite from '@salesforce-ux/design-system/assets/icons/doctype-sprite/svg/symbols.svg';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';

import getApiFetch from 'utils/api';
import { cache, persistMiddleware } from 'utils/caching';
import { createSocket } from 'utils/websockets';
import { logError } from 'utils/logging';
import { routePatterns } from 'utils/routes';

import reducer from 'app/reducer';

import { login } from 'accounts/actions';

import { fetchProducts } from 'products/actions';

import AuthError from 'components/authError';
import ErrorBoundary from 'components/error';
import Footer from 'components/footer';
import FourOhFour from 'components/404';
import Header from 'components/header';
import JobDetail from 'components/jobs/detail';
import PlanDetail from 'components/plans/detail';
import ProductsList from 'components/products/list';
import { ProductDetail, VersionDetail } from 'components/products/detail';

const SF_logo = require('images/salesforce-logo.png');

const App = () => (
  <DocumentTitle title="MetaDeploy">
    <div
      className="slds-grid
        slds-grid_frame
        slds-grid_vertical"
    >
      <ErrorBoundary>
        <Header />
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
        <Footer logoSrc={SF_logo} />
      </ErrorBoundary>
    </div>
  </DocumentTitle>
);

cache
  .getAll()
  .then(data => {
    const el = document.getElementById('app');
    if (el) {
      // Create store
      const appStore = createStore(
        reducer,
        data,
        composeWithDevTools(
          applyMiddleware(
            thunk.withExtraArgument({
              apiFetch: getApiFetch(),
            }),
            persistMiddleware,
            logger,
          ),
        ),
      );

      // Connect to WebSocket server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      window.socket = createSocket({
        url: `${protocol}//${host}${window.api_urls.ws_notifications()}`,
        dispatch: appStore.dispatch,
      });

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
  })
  .catch(err => {
    logError(err);
    throw err;
  });
