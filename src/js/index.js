// @flow

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import Footer from 'components/footer';
import Header from 'components/header';
import getApiFetch from 'utils/api';
import userReducer from 'accounts/reducer';
import { cache, persistMiddleware } from 'utils/caching';
import { doLocalLogout } from 'accounts/actions';

const MD_logo = require('images/metadeploy-logo.png');
const SF_logo = require('images/salesforce-logo.png');

const Home = () => (
  <div>
    Homepage
    <Link to="/foo">this is a broken link</Link>
  </div>
);

const NoMatch = () => (
  <div>
    Oops! 404...
    <Link to="/">go home</Link>
  </div>
);

const App = () => (
  <div>
    <Header logoSrc={MD_logo} />
    <Switch>
      <Route exact path="/" component={Home} />
      <Route component={NoMatch} />
    </Switch>
    <Footer logoSrc={SF_logo} />
  </div>
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
          <IconSettings utilitySprite={utilitySprite}>
            <App />
          </IconSettings>
        </Router>
      </Provider>,
      el,
    );
  }
});
