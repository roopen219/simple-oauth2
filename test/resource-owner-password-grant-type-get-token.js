import {
  describe, it, expect, beforeEach, afterEach, vi
} from "vitest";
import { ResourceOwnerPassword } from "../index.js";
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
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
      client_id: "the client id",
      client_secret: "the client secret",
    };

    const scopeOptions = getJSONEncodingScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig({
      options: {
        bodyFormat: "json",
        authorizationMethod: "body",
      },
    });

    const tokenParams = {
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token (body credentials and form format)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
      client_id: "the client id",
      client_secret: "the client secret",
    };

    const scopeOptions = getFormEncodingScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig({
      options: {
        bodyFormat: "form",
        authorizationMethod: "body",
      },
    });

    const tokenParams = {
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token (header credentials)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig({
      options: {
        authorizationMethod: "header",
      },
    });

    const tokenParams = {
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (header credentials + loose encoding)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        Authorization: "Basic dGhlICsgY2xpZW50ICsgaWQgJiBzeW1ib2xzOnRoZSArIGNsaWVudCArIHNlY3JldCAmIHN5bWJvbHM=",
      },
    });

    server.tokenSuccess(scopeOptions, tokenRequestParams);

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
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (header credentials + strict encoding)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        Authorization:
          "Basic dGhlKyUyQitjbGllbnQrJTJCK2lkKyUyNitzeW1ib2xzOnRoZSslMkIrY2xpZW50KyUyQitzZWNyZXQrJTI2K3N5bWJvbHM=",
      },
    });

    server.tokenSuccess(scopeOptions, tokenRequestParams);

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
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (header credentials with unescaped characters + strict encoding)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        Authorization:
          "Basic SSUyN20rdGhlX2NsaWVudC1pZCUyMSslMjYrJTI4c3ltYm9scyUyQSUyOTpJJTI3bSt0aGVfY2xpZW50LXNlY3JldCUyMSslMjYrJTI4c3ltYm9scyUyQSUyOQ==",
      },
    });

    server.tokenSuccess(scopeOptions, tokenRequestParams);

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
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (access token host and path)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccessWithCustomPath("/oauth/token", scopeOptions, tokenRequestParams);

    const config = createModuleConfig({
      auth: {
        tokenHost: "https://authorization-server.org/root/",
        tokenPath: "/oauth/token",
      },
    });

    const tokenParams = {
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with custom module configuration (http options)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-MYTHICAL-HEADER": "mythical value",
        "USER-AGENT": "hello agent",
      },
    });

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig({
      http: {
        headers: {
          "X-MYTHICAL-HEADER": "mythical value",
          "USER-AGENT": "hello agent",
        },
      },
    });

    const tokenParams = {
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);
    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("@getToken => resolves to an access token with custom module configuration (token separator)", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
      scope: "scope-a,scope-b",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const tokenParams = {
      username: "alice",
      password: "secret",
      scope: ["scope-a", "scope-b"],
    };

    const config = createModuleConfig({
      options: {
        scopeSeparator: ",",
      },
    });

    const oauth2 = new ResourceOwnerPassword(config);

    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token while requesting multiple scopes", async () => {
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
      scope: "scope-a scope-b",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const tokenParams = {
      username: "alice",
      password: "secret",
      scope: ["scope-a", "scope-b"],
    };

    const config = createModuleConfig();
    const oauth2 = new ResourceOwnerPassword(config);

    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with a custom grant type", async () => {
    const tokenRequestParams = {
      grant_type: "my_grant",
      username: "alice",
      password: "secret",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const tokenParams = {
      grant_type: "my_grant",
      username: "alice",
      password: "secret",
    };

    const config = createModuleConfig();
    const oauth2 = new ResourceOwnerPassword(config);

    const accessToken = await oauth2.getToken(tokenParams);

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with no params", async () => {
    const tokenRequestParams = {
      grant_type: "password",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig();
    const oauth2 = new ResourceOwnerPassword(config);

    const accessToken = await oauth2.getToken();

    server.fetchMock.done();
    expect(accessToken instanceof AccessToken).toBe(true);
  });

  it("resolves to an access token with custom (inline) http options", async () => {
    const tokenRequestParams = {
      grant_type: "password",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions({
      reqheaders: {
        "X-REQUEST-ID": 123,
      },
    });

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig();
    const oauth2 = new ResourceOwnerPassword(config);

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
    const tokenRequestParams = {
      grant_type: "password",
    };

    const scopeOptions = getHeaderCredentialsScopeOptions();

    server.tokenSuccess(scopeOptions, tokenRequestParams);

    const config = createModuleConfig();
    const oauth2 = new ResourceOwnerPassword(config);

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
    const tokenRequestParams = {
      grant_type: "password",
      username: "alice",
      password: "secret",
      client_id: "the client id",
      client_secret: "the client secret",
    };

    const scopeOptions = getJSONEncodingScopeOptions();

    server.tokenSuccessWithNonJSONContent(scopeOptions, tokenRequestParams);

    const config = createModuleConfig({
      options: {
        bodyFormat: "json",
        authorizationMethod: "body",
      },
    });

    const tokenParams = {
      username: "alice",
      password: "secret",
    };

    const oauth2 = new ResourceOwnerPassword(config);

    await expect(oauth2.getToken(tokenParams)).rejects.toThrow();

    server.fetchMock.done();
  });
});
