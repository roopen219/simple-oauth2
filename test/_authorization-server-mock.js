import { applyToDefaults } from "@hapi/hoek";

function getJSONEncodingScopeOptions(options = {}) {
  return applyToDefaults(
    {
      reqheaders: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
    options
  );
}

function getFormEncodingScopeOptions(options = {}) {
  return applyToDefaults(
    {
      reqheaders: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    options
  );
}

function getHeaderCredentialsScopeOptions(options = {}) {
  return applyToDefaults(
    {
      reqheaders: {
        Accept: "application/json",
        Authorization: "Basic dGhlK2NsaWVudCtpZDp0aGUrY2xpZW50K3NlY3JldA==",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
    options
  );
}

export { getJSONEncodingScopeOptions, getFormEncodingScopeOptions, getHeaderCredentialsScopeOptions };
