// @flow

import i18n_backend from 'i18next-xhr-backend';
import i18n_detector from 'i18next-browser-languagedetector';
import { reactI18nextModule } from 'react-i18next';
import { use } from 'i18next';

import { logError } from 'utils/logging';

const init = (cb: () => void): void =>
  use(i18n_detector)
    .use(i18n_backend)
    .use(reactI18nextModule)
    .init(
      {
        fallbackLng: 'en',
        keySeparator: false,
        nsSeparator: false,
        returnNull: false,
        returnEmptyString: false,
        interpolation: {
          escapeValue: false,
        },
        saveMissing: true,
        missingKeyHandler(lng, ns, key, fallbackValue) {
          logError('missing translation', { lng, ns, key, fallbackValue });
        },
        backend: {
          loadPath: '/static/{{lng}}/{{ns}}.json',
        },
      },
      cb,
    );

export default init;
