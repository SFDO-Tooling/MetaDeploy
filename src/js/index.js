// @flow

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import logger from 'redux-logger';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import thunk from 'redux-thunk';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import getApiFetch from 'utils/api';
import productsReducer from 'products/reducer';
import userReducer from 'accounts/reducer';
import { cache, persistMiddleware } from 'utils/caching';
import { doLocalLogout } from 'accounts/actions';

import Footer from 'components/footer';
import FourOhFour from 'components/404';
import Header from 'components/header';
import ProductsList from 'components/products';

const SF_logo = require('images/salesforce-logo.png');

const App = () => (
  <DocumentTitle title="MetaDeploy">
    <div className="slds-grid slds-grid_frame slds-grid_vertical">
      <Header />
      <div
        className="slds-grow slds-shrink-none slds-text-longform
          slds-p-horizontal_medium slds-p-vertical_large"
      >
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/products" />} />
          <Route exact path="/products" component={ProductsList} />
          <Route component={FourOhFour} />
        </Switch>
      </div>
      <Footer logoSrc={SF_logo} />
    </div>
  </DocumentTitle>
);

cache
  .getAll()
  .then(data => {
    const el = document.getElementById('app');
    if (el) {
      // Initialize with correct logged-in/out status
      const user = el.getAttribute('data-user');
      data.user = null;
      if (user !== null && user !== undefined) {
        try {
          data.user = JSON.parse(user);
        } catch (err) {
          // swallow error
        }
      }
      const appStore = createStore(
        combineReducers({
          user: userReducer,
          products: productsReducer,
        }),
        data,
        composeWithDevTools(
          applyMiddleware(
            thunk.withExtraArgument({
              apiFetch: getApiFetch(() => {
                appStore.dispatch(doLocalLogout());
              }),
            }),
            persistMiddleware,
            logger,
          ),
        ),
      );
      ReactDOM.render(
        <Provider store={appStore}>
          <Router>
            <IconSettings
              standardSprite={standardSprite}
              utilitySprite={utilitySprite}
            >
              <App />
            </IconSettings>
          </Router>
        </Provider>,
        el,
      );
    }
  })
  .catch(err => {
    window.console.error(err);
    throw err;
  });
