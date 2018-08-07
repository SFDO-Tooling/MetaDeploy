// @flow

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import IconSettings from '@salesforce/design-system-react/components/icon-settings';
import logger from 'redux-logger';
import utilitySprite from '@salesforce-ux/design-system/assets/icons/utility-sprite/svg/symbols.svg';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import { cache, persistMiddleware } from './caching';

const App = () => <div>MetaDeploy</div>;

cache.getAll().then(data => {
  const appStore = createStore(
    combineReducers({
      // ...
    }),
    data,
    composeWithDevTools(applyMiddleware(persistMiddleware, logger)),
  );

  const el = document.getElementById('app');
  if (el) {
    ReactDOM.render(
      <IconSettings utilitySprite={utilitySprite}>
        <Provider store={appStore}>
          <App />
        </Provider>
      </IconSettings>,
      el,
    );
  }
});
