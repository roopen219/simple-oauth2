import {
  describe, it, expect, beforeEach, afterEach, vi
} from "vitest";

import Chance from "./_chance.js";
import AccessToken from "../lib/access-token.js";
import { Client } from "../lib/client/index.js";
import { has } from "./_property.js";
import { createModuleConfigWithDefaults as createModuleConfig } from "./_module-config.js";
import { createAuthorizationServer } from "./_fetch-mock.js";
import { getHeaderCredentialsScopeOptions } from "./_authorization-server-mock.js";

const chance = new Chance();

const scopeOptions = {
  reqheaders: {
    Accept: "application/json",
    Authorization: "Basic dGhlK2NsaWVudCtpZDp0aGUrY2xpZW50K3NlY3JldA==",
  },
};

describe("AccessToken @refresh", () => {
  let server;

  beforeEach(() => {
    server = createAuthorizationServer("https://authorization-server.org");
    vi.stubGlobal("fetch", server.fetchMock.fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a new access token with default params", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshParams = {
      grant_type: "refresh_token",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccess(scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh();

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with a custom grant type", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshParams = {
      grant_type: "my_grant",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccess(scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh({
      grant_type: "my_grant",
    });

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with multiple scopes", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshParams = {
      grant_type: "refresh_token",
      scope: "scope-a scope-b",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccess(scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh({
      scope: ["scope-a", "scope-b"],
    });

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with custom params", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshParams = {
      grant_type: "refresh_token",
      scope: "TESTING_EXAMPLE_SCOPES",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccess(scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh({
      scope: "TESTING_EXAMPLE_SCOPES",
    });

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with custom module configuration (scope separator)", async () => {
    const config = createModuleConfig({
      options: {
        scopeSeparator: ",",
      },
    });

    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshParams = {
      grant_type: "refresh_token",
      scope: "scope-a,scope-b",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccess(scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh({
      scope: ["scope-a", "scope-b"],
    });

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with a custom token path", async () => {
    const config = createModuleConfig({
      auth: {
        tokenPath: "/the-custom/path",
      },
    });

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const client = new Client(config);

    const refreshParams = {
      grant_type: "refresh_token",
      scope: "TESTING_EXAMPLE_SCOPES",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccessWithCustomPath("/the-custom/path", scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh({ scope: "TESTING_EXAMPLE_SCOPES" });

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with a custom refresh path", async () => {
    const config = createModuleConfig({
      auth: {
        refreshPath: "/the-custom/refresh-path",
      },
    });

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const client = new Client(config);

    const refreshParams = {
      grant_type: "refresh_token",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccessWithCustomPath("/the-custom/refresh-path", scopeOptions, refreshParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh();

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with custom (inline) http options", async () => {
    const config = createModuleConfig();

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const client = new Client(config);

    const refreshParams = {
      grant_type: "refresh_token",
      refresh_token: accessTokenResponse.refresh_token,
    };

    const customScopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-REQUEST-ID": 123,
      },
    });

    server.tokenSuccess(customScopeOptions, refreshParams);

    const httpOptions = {
      headers: {
        "X-REQUEST-ID": 123,
      },
    };

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh(null, httpOptions);

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });

  it("creates a new access token with custom (inline) http options without overriding (required) http options", async () => {
    const config = createModuleConfig();

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const client = new Client(config);

    const refreshParams = {
      grant_type: "refresh_token",
      refresh_token: accessTokenResponse.refresh_token,
    };

    server.tokenSuccess(scopeOptions, refreshParams);

    const httpOptions = {
      headers: {
        Authorization: "Basic credentials",
      },
    };

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const refreshAccessToken = await accessToken.refresh(null, httpOptions);

    server.fetchMock.done();
    expect(has(refreshAccessToken.token, "access_token")).toBe(true);
  });
});
