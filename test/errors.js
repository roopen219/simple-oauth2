import {
  describe, it, expect, beforeEach, afterEach, vi
} from "vitest";
import { AuthorizationCode } from "../index.js";
import { createModuleConfig } from "./_module-config.js";
import { createAuthorizationServer } from "./_fetch-mock.js";
import { getHeaderCredentialsScopeOptions } from "./_authorization-server-mock.js";

const tokenParams = {
  code: "code",
  redirect_uri: "http://callback.com",
};

const oauthParams = {
  grant_type: "authorization_code",
  code: "code",
  redirect_uri: "http://callback.com",
};

describe("OAuth2 @errors", () => {
  let server;

  beforeEach(() => {
    server = createAuthorizationServer("https://authorization-server.org");
    vi.stubGlobal("fetch", server.fetchMock.fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetch is properly stubbed", () => {
    expect(global.fetch).toBeDefined();
    expect(vi.isMockFunction(global.fetch)).toBe(true);
  });

  it("fetch mock is called with correct arguments", async () => {
    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenAuthorizationError(scopeOptions, oauthParams);

    // Call fetch directly to test
    const response = await global.fetch("https://authorization-server.org/oauth/token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: "Basic dGhlK2NsaWVudCtpZDp0aGUrY2xpZW50K3NlY3JldA==",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(oauthParams).toString(),
    });

    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
  });

  it("rejects operations on http error (401)", async () => {
    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenAuthorizationError(scopeOptions, oauthParams);

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    await expect(oauth2.getToken(tokenParams)).rejects.toThrow();

    server.fetchMock.done();
  });

  it("rejects operations on http error (500)", async () => {
    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenError(scopeOptions, oauthParams);

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    await expect(oauth2.getToken(tokenParams)).rejects.toThrow();

    server.fetchMock.done();
  });
});
