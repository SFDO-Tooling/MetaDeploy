const api_urls = (function () {
  "use strict";
  const data = {
    "urls": [
      ["account_change_password", [
        ["accounts/password/change/", []]
      ]],
      ["account_confirm_email", [
        ["accounts/confirm-email/%(key)s/", ["key"]]
      ]],
      ["account_email", [
        ["accounts/email/", []]
      ]],
      ["account_email_verification_sent", [
        ["accounts/confirm-email/", []]
      ]],
      ["account_inactive", [
        ["accounts/inactive/", []]
      ]],
      ["account_login", [
        ["accounts/login/", []]
      ]],
      ["account_logout", [
        ["accounts/logout/", []]
      ]],
      ["account_reset_password", [
        ["accounts/password/reset/", []]
      ]],
      ["account_reset_password_done", [
        ["accounts/password/reset/done/", []]
      ]],
      ["account_reset_password_from_key", [
        ["accounts/password/reset/key/%(uidb36)s-%(key)s/", ["uidb36", "key"]]
      ]],
      ["account_reset_password_from_key_done", [
        ["accounts/password/reset/key/done/", []]
      ]],
      ["account_set_password", [
        ["accounts/password/set/", []]
      ]],
      ["account_signup", [
        ["accounts/signup/", []]
      ]],
      ["api-root", [
        ["api/.%(format)s", ["format"]],
        ["api/", []]
      ]],
      ["database_file", [
        ["files/%(name)s", ["name"]]
      ]],
      ["frontend", [
        ["products", []]
      ]],
      ["home", [
        ["", []]
      ]],
      ["job-detail", [
        ["api/jobs/%(pk)s.%(format)s", ["pk", "format"]],
        ["api/jobs/%(pk)s/", ["pk"]]
      ]],
      ["job-list", [
        ["api/jobs.%(format)s", ["format"]],
        ["api/jobs/", []]
      ]],
      ["org-list", [
        ["api/orgs.%(format)s", ["format"]],
        ["api/orgs/", []]
      ]],
      ["plan-detail", [
        ["api/plans/%(pk)s.%(format)s", ["pk", "format"]],
        ["api/plans/%(pk)s/", ["pk"]]
      ]],
      ["plan-get-one", [
        ["api/plans/get_one.%(format)s", ["format"]],
        ["api/plans/get_one/", []]
      ]],
      ["plan-list", [
        ["api/plans.%(format)s", ["format"]],
        ["api/plans/", []]
      ]],
      ["plan-preflight", [
        ["api/plans/%(pk)s/preflight.%(format)s", ["pk", "format"]],
        ["api/plans/%(pk)s/preflight/", ["pk"]]
      ]],
      ["plan-scratch-org", [
        ["api/plans/%(pk)s/scratch_org.%(format)s", ["pk", "format"]],
        ["api/plans/%(pk)s/scratch_org/", ["pk"]]
      ]],
      ["product-detail", [
        ["api/products/%(pk)s.%(format)s", ["pk", "format"]],
        ["api/products/%(pk)s/", ["pk"]]
      ]],
      ["product-get-one", [
        ["api/products/get_one.%(format)s", ["format"]],
        ["api/products/get_one/", []]
      ]],
      ["product-list", [
        ["api/products.%(format)s", ["format"]],
        ["api/products/", []]
      ]],
      ["productcategory-detail", [
        ["api/categories/%(pk)s.%(format)s", ["pk", "format"]],
        ["api/categories/%(pk)s/", ["pk"]]
      ]],
      ["productcategory-list", [
        ["api/categories.%(format)s", ["format"]],
        ["api/categories/", []]
      ]],
      ["salesforce_callback", [
        ["accounts/salesforce/login/callback/", []]
      ]],
      ["salesforce_login", [
        ["accounts/salesforce/login/", []]
      ]],
      ["user", [
        ["api/user/", []]
      ]],
      ["version-additional-plans", [
        ["api/versions/%(pk)s/additional_plans.%(format)s", ["pk", "format"]],
        ["api/versions/%(pk)s/additional_plans/", ["pk"]]
      ]],
      ["version-detail", [
        ["api/versions/%(pk)s.%(format)s", ["pk", "format"]],
        ["api/versions/%(pk)s/", ["pk"]]
      ]],
      ["version-get-one", [
        ["api/versions/get_one.%(format)s", ["format"]],
        ["api/versions/get_one/", []]
      ]],
      ["version-list", [
        ["api/versions.%(format)s", ["format"]],
        ["api/versions/", []]
      ]],
      ["ws_notifications", [
        ["ws/notifications/", []]
      ]]
    ],
    "prefix": "/"
  };

  function factory(d) {
    var url_patterns = d.urls;
    var url_prefix = d.prefix;
    var Urls = {};
    var self_url_patterns = {};
    var _get_url = function (url_pattern) {
      return function () {
        var _arguments, index, url, url_arg, url_args, _i, _len, _ref, _ref_list, match_ref, provided_keys, build_kwargs;
        _arguments = arguments;
        _ref_list = self_url_patterns[url_pattern];
        if (arguments.length == 1 && typeof (arguments[0]) == "object") {
          var provided_keys_list = Object.keys(arguments[0]);
          provided_keys = {};
          for (_i = 0; _i < provided_keys_list.length; _i++)
            provided_keys[provided_keys_list[_i]] = 1;
          match_ref = function (ref) {
            var _i;
            if (ref[1].length != provided_keys_list.length)
              return false;
            for (_i = 0; _i < ref[1].length && ref[1][_i] in provided_keys; _i++);
            return _i == ref[1].length;
          }
          build_kwargs = function (keys) {
            return _arguments[0];
          }
        } else {
          match_ref = function (ref) {
            return ref[1].length == _arguments.length;
          }
          build_kwargs = function (keys) {
            var kwargs = {};
            for (var i = 0; i < keys.length; i++) {
              kwargs[keys[i]] = _arguments[i];
            }
            return kwargs;
          }
        }
        for (_i = 0; _i < _ref_list.length && !match_ref(_ref_list[_i]); _i++);
        if (_i == _ref_list.length)
          return null;
        _ref = _ref_list[_i];
        url = _ref[0], url_args = build_kwargs(_ref[1]);
        for (url_arg in url_args) {
          var url_arg_value = url_args[url_arg];
          if (url_arg_value === undefined || url_arg_value === null) {
            url_arg_value = '';
          } else {
            url_arg_value = url_arg_value.toString();
          }
          url = url.replace("%(" + url_arg + ")s", url_arg_value);
        }
        return url_prefix + url;
      };
    };
    var name, pattern, url, _i, _len, _ref;
    for (_i = 0, _len = url_patterns.length; _i < _len; _i++) {
      _ref = url_patterns[_i], name = _ref[0], pattern = _ref[1];
      self_url_patterns[name] = pattern;
      url = _get_url(name);
      Urls[name.replace(/[-_]+(.)/g, function (_m, p1) {
        return p1.toUpperCase();
      })] = url;
      Urls[name.replace(/-/g, '_')] = url;
      Urls[name] = url;
    }
    return Urls;
  }
  return data ? factory(data) : factory;
})();

export api_urls;
