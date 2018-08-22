// @flow

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import DocumentTitle from 'react-document-title';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import logger from 'redux-logger';
import standardSprite from '@salesforce-ux/design-system/assets/icons/standard-sprite/svg/symbols.svg';
import thunk from 'redux-thunk';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import Footer from 'components/footer';
import FourOhFour from 'components/404';
import Header from 'components/header';
import getApiFetch from 'utils/api';
import userReducer from 'accounts/reducer';
import { cache, persistMiddleware } from 'utils/caching';
import { doLocalLogout } from 'accounts/actions';

const SF_logo = require('images/salesforce-logo.png');

const Home = () => (
  <div
    className="site-intro slds-grow slds-shrink-none
    slds-p-horizontal_medium slds-p-vertical_large"
  >
    <h1>Welcome to MetaDeploy!</h1>
    <p>
      This is some sample intro text, where (in the project-template) we might
      provide some basic quickstart instructions and documentation.
    </p>
  </div>
);

const App = () => (
  <DocumentTitle title="MetaDeploy">
    <div className="site-page-wrapper slds-grid slds-grid_vertical">
      <Header />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route component={FourOhFour} />
      </Switch>
      <Footer logoSrc={SF_logo} />
    </div>
  </DocumentTitle>
);

cache.getAll().then(data => {
  const el = document.getElementById('app');
  if (el) {
    // Initialize with correct logged-in/out status
    const username = el.getAttribute('data-username');
    if (username !== null && username !== undefined) {
      data.user = { username };
    } else {
      data.user = null;
    }
    const appStore = createStore(
      combineReducers({
        user: userReducer,
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
});
