/* eslint-env jest */

'use strict';

const i18n = jest.genMockFromModule('i18next');

i18n.t = jest.fn(str => str);

module.exports = i18n;
