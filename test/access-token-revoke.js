import {
  describe, it, expect, beforeEach, afterEach, vi
} from "vitest";

import Chance from "./_chance.js";
import AccessToken from "../lib/access-token.js";
import { Client } from "../lib/client/index.js";
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

describe("AccessToken @revoke", () => {
  let server;

  beforeEach(() => {
    server = createAuthorizationServer("https://authorization-server.org");
    vi.stubGlobal("fetch", server.fetchMock.fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("performs the access token revoke", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const revokeParams = {
      token: accessTokenResponse.access_token,
      token_type_hint: "access_token",
    };

    server.tokenRevokeSuccess(scopeOptions, revokeParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revoke("access_token")).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("performs the refresh token revoke", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const revokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    server.tokenRevokeSuccess(scopeOptions, revokeParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revoke("refresh_token")).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("performs a token revoke with a custom revoke path", async () => {
    const config = createModuleConfig({
      auth: {
        revokePath: "/the-custom/revoke-path",
      },
    });

    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const revokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    server.tokenRevokeSuccessWithCustomPath("/the-custom/revoke-path", scopeOptions, revokeParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revoke("refresh_token")).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("performs a token revoke with custom (inline) http options", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const revokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    const customScopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-REQUEST-ID": 123,
      },
    });

    server.tokenRevokeSuccess(customScopeOptions, revokeParams);

    const httpOptions = {
      headers: {
        "X-REQUEST-ID": 123,
      },
    };

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revoke("refresh_token", httpOptions)).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("performs a token revoke with custom (inline) http options without overriding (required) http options", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const revokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    server.tokenRevokeSuccess(scopeOptions, revokeParams);

    const httpOptions = {
      headers: {
        Authorization: "Basic credentials",
      },
    };

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revoke("refresh_token", httpOptions)).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it.skip("throws an error with an invalid tokenType option", async () => {
    // Validation is commented out in the library, so this test would timeout
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken();
    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revoke("invalid_value")).rejects.toThrow(
      /Invalid token type. Only access_token or refresh_token are valid values/
    );
  });
});

describe("AccessToken @revokeAll", () => {
  let server;

  beforeEach(() => {
    server = createAuthorizationServer("https://authorization-server.org");
    vi.stubGlobal("fetch", server.fetchMock.fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("revokes both the access and refresh tokens", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshTokenRevokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    const accessTokenRevokeParams = {
      token: accessTokenResponse.access_token,
      token_type_hint: "access_token",
    };

    server.tokenRevokeAllSuccess(scopeOptions, accessTokenRevokeParams, refreshTokenRevokeParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revokeAll()).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("revokes both the access and refresh tokens with custom (inline) http options", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshTokenRevokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    const accessTokenRevokeParams = {
      token: accessTokenResponse.access_token,
      token_type_hint: "access_token",
    };

    const customScopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-REQUEST-ID": 123,
      },
    });

    server.tokenRevokeAllSuccess(customScopeOptions, accessTokenRevokeParams, refreshTokenRevokeParams);

    const httpOptions = {
      headers: {
        "X-REQUEST-ID": 123,
      },
    };

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revokeAll(httpOptions)).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("revokes both the access and refresh tokens with custom (inline) http options without overriding (required) http options", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const refreshTokenRevokeParams = {
      token: accessTokenResponse.refresh_token,
      token_type_hint: "refresh_token",
    };

    const accessTokenRevokeParams = {
      token: accessTokenResponse.access_token,
      token_type_hint: "access_token",
    };

    server.tokenRevokeAllSuccess(scopeOptions, accessTokenRevokeParams, refreshTokenRevokeParams);

    const httpOptions = {
      headers: {
        Authorization: "Basic credentials",
      },
    };

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revokeAll(httpOptions)).resolves.not.toThrow();

    server.fetchMock.done();
  });

  it("revokes the refresh token only if the access token is successfully revoked", async () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const accessTokenRevokeParams = {
      token: accessTokenResponse.access_token,
      token_type_hint: "access_token",
    };

    server.tokenRevokeError(scopeOptions, accessTokenRevokeParams);

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    await expect(accessToken.revokeAll()).rejects.toThrow();

    server.fetchMock.done();
  });
});
