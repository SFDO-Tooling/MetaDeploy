import i18n from 'i18next';
import i18n_backend from 'i18next-xhr-backend';
import i18n_detector from 'i18next-browser-languagedetector';
import { reactI18nextModule } from 'react-i18next';

i18n
  .use(i18n_detector)
  .use(i18n_backend)
  .use(reactI18nextModule)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    initImmediate: false,
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    saveMissing: true,
    react: {
      wait: true,
    },
    backend: {
      loadPath: '/static/{{lng}}/{{ns}}.json',
    },
  });

export default i18n;
