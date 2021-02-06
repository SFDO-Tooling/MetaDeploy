"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.CONSTANTS = void 0;
exports.CONSTANTS = {
    STATUS: {
        STARTED: 'started',
        COMPLETE: 'complete',
        FAILED: 'failed',
        CANCELED: 'canceled'
    },
    RESULT_STATUS: {
        OK: 'ok',
        WARN: 'warn',
        ERROR: 'error',
        SKIP: 'skip',
        OPTIONAL: 'optional',
        HIDE: 'hide'
    },
    AUTO_START_PREFLIGHT: 'start_preflight'
};
var reducer = function (preflights, action) {
    var _a, _b;
    if (preflights === void 0) { preflights = {}; }
    switch (action.type) {
        case 'USER_LOGGED_OUT':
            return {};
        case 'FETCH_PREFLIGHT_SUCCEEDED': {
            var _c = action.payload, plan = _c.plan, preflight = _c.preflight;
            return __assign(__assign({}, preflights), (_a = {}, _a[plan] = preflight, _a));
        }
        case 'PREFLIGHT_STARTED':
        case 'PREFLIGHT_COMPLETED':
        case 'PREFLIGHT_FAILED':
        case 'PREFLIGHT_CANCELED':
        case 'PREFLIGHT_INVALIDATED': {
            var preflight = action.payload;
            var plan = preflight.plan;
            var existingPreflight = preflights[plan];
            if (!existingPreflight ||
                preflight.edited_at > existingPreflight.edited_at) {
                return __assign(__assign({}, preflights), (_b = {}, _b[plan] = preflight, _b));
            }
            return preflights;
        }
    }
    return preflights;
};
exports["default"] = reducer;
