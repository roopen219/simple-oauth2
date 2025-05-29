import {
  describe, it, expect, beforeEach, afterEach, vi
} from "vitest";
import { AuthorizationCode } from "../index.js";
import AccessToken from "../lib/access-token.js";
import { createModuleConfig } from "./_module-config.js";
import { createAuthorizationServer } from "./_fetch-mock.js";
import {
  getJSONEncodingScopeOptions,
  getFormEncodingScopeOptions,
  getHeaderCredentialsScopeOptions,
} from "./_authorization-server-mock.js";

describe("getToken", () => {
  let server;

  beforeEach(() => {
    server = createAuthorizationServer("https://authorization-server.org");
    vi.stubGlobal("fetch", server.fetchMock.fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves to an access token (body credentials and JSON format)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
      client_id: "the client id",
      client_secret: "the client secret",
    };

    const scopeOptions = getJSONEncodingScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      options: {
        bodyFormat: "json",
        authorizationMethod: "body",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);

    try {
      const accessToken = await oauth2.getToken(tokenParams);
      expect(accessToken instanceof AccessToken).toBe(true);
    } catch (error) {
      console.error("Test failed with error:", error);
      throw error;
    } finally {
      server.fetchMock.done();
    }
  }, 10000);

  it("resolves to an access token (body credentials and form format)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
      client_id: "the client id",
      client_secret: "the client secret",
    };

    const scopeOptions = getFormEncodingScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      options: {
        bodyFormat: "form",
        authorizationMethod: "body",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token (header credentials)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      options: {
        authorizationMethod: "header",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (header credentials + loose encoding)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        Authorization: "Basic dGhlICsgY2xpZW50ICsgaWQgJiBzeW1ib2xzOnRoZSArIGNsaWVudCArIHNlY3JldCAmIHN5bWJvbHM=",
      },
    });

    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      client: {
        id: "the + client + id & symbols",
        secret: "the + client + secret & symbols",
      },
      options: {
        authorizationMethod: "header",
        credentialsEncodingMode: "loose",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (header credentials + strict encoding)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        Authorization:
          "Basic dGhlKyUyQitjbGllbnQrJTJCK2lkKyUyNitzeW1ib2xzOnRoZSslMkIrY2xpZW50KyUyQitzZWNyZXQrJTI2K3N5bWJvbHM=",
      },
    });

    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      client: {
        id: "the + client + id & symbols",
        secret: "the + client + secret & symbols",
      },
      options: {
        authorizationMethod: "header",
        credentialsEncodingMode: "strict",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (header credentials with unescaped characters + strict encoding)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        Authorization:
          "Basic SSUyN20rdGhlX2NsaWVudC1pZCUyMSslMjYrJTI4c3ltYm9scyUyQSUyOTpJJTI3bSt0aGVfY2xpZW50LXNlY3JldCUyMSslMjYrJTI4c3ltYm9scyUyQSUyOQ==",
      },
    });

    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      client: {
        id: "I'm the_client-id! & (symbols*)",
        secret: "I'm the_client-secret! & (symbols*)",
      },
      options: {
        authorizationMethod: "header",
        credentialsEncodingMode: "strict",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (access token host and path)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccessWithCustomPath("/oauth/token", scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      auth: {
        tokenHost: "https://authorization-server.org/root/",
        tokenPath: "/oauth/token",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with custom module configuration (http options)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-MYTHICAL-HEADER": "mythical value",
        "USER-AGENT": "hello agent",
      },
    });

    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      http: {
        headers: {
          "X-MYTHICAL-HEADER": "mythical value",
          "USER-AGENT": "hello agent",
        },
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (scope separator)", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
      scope: "scope-a,scope-b",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      options: {
        scopeSeparator: ",",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
      scope: ["scope-a", "scope-b"],
    };

    const oauth2 = new AuthorizationCode(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token while requesting multiple scopes", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
      scope: "scope-a scope-b",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
      scope: ["scope-a", "scope-b"],
    };

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with a custom grant type", async () => {
    const expectedRequestParams = {
      code: "code",
      redirect_uri: "http://callback.com",
      grant_type: "my_grant",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
      grant_type: "my_grant",
    };

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with no params", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    const accessToken = await oauth2.getToken();

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with custom (inline) http options", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-REQUEST-ID": 123,
      },
    });

    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    const httpOptions = {
      headers: {
        "X-REQUEST-ID": 123,
      },
    };

    const accessToken = await oauth2.getToken(null, httpOptions);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom (inline) http options without overriding (required) http options", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();
    server.tokenSuccess(scopeOptions, expectedRequestParams);

    const config = createModuleConfig();
    const oauth2 = new AuthorizationCode(config);

    const httpOptions = {
      headers: {
        Authorization: "Basic credentials",
      },
    };

    const accessToken = await oauth2.getToken(null, httpOptions);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("rejects the operation when a non json response is received", async () => {
    const expectedRequestParams = {
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "http://callback.com",
      client_id: "the client id",
      client_secret: "the client secret",
    };

    const scopeOptions = getJSONEncodingScopeOptions();
    server.tokenSuccessWithNonJSONContent(scopeOptions, expectedRequestParams);

    const config = createModuleConfig({
      options: {
        bodyFormat: "json",
        authorizationMethod: "body",
      },
    });

    const tokenParams = {
      code: "code",
      redirect_uri: "http://callback.com",
    };

    const oauth2 = new AuthorizationCode(config);

    await expect(oauth2.getToken(tokenParams)).rejects.toThrow();

    server.fetchMock.done();
  });
});
