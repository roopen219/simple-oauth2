import { vi } from "vitest";
import Boom from "@hapi/boom";
import qs from "qs";

const accessToken = {
  access_token: "5683E74C-7514-4426-B64F-CF0C24223F69",
  refresh_token: "8D175C5F-AE24-4333-8795-332B3BDA8FE3",
  token_type: "bearer",
  expires_in: "240000",
};

// Add a simple deepEqual function for objects/arrays
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, idx) => deepEqual(item, b[idx]));
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]));
}

class FetchMock {
  constructor() {
    this.mockResponses = [];
    this.fetchSpy = vi.fn(this.handleFetch.bind(this));
  }

  async handleFetch(url, options = {}) {
    const mockResponse = this.findMatchingResponse(url, options);

    if (!mockResponse) {
      console.error(`No mock found for ${options.method || "GET"} ${url}`);
      console.error("Request body:", options.body);
      console.error("Request headers:", options.headers);
      console.error(
        "Available mocks:",
        this.mockResponses.map((m) => ({
          url: m.url,
          method: m.method,
          body: m.body,
          reqheaders: m.reqheaders,
        }))
      );
      throw new Error(`No mock found for ${options.method || "GET"} ${url}`);
    }

    const { status, body, headers } = mockResponse;

    // Create headers map
    const headersMap = new Map();
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        headersMap.set(key, value);
      });
    }

    // Create Response-like object that matches what the code expects
    const response = {
      ok: status >= 200 && status < 300,
      status,
      statusText: FetchMock.getStatusText(status),
      headers: {
        get: (name) => headersMap.get(name) || null,
        has: (name) => headersMap.has(name),
        entries: () => headersMap.entries(),
        forEach: (callback) => headersMap.forEach(callback),
        keys: () => headersMap.keys(),
        values: () => headersMap.values(),
      },
      text: async () => {
        if (body === null || body === undefined) return "";
        if (typeof body === "string") return body;
        return JSON.stringify(body);
      },
      json: async () => {
        if (body === null || body === undefined) return null;
        if (typeof body === "string") return JSON.parse(body);
        return body;
      },
      clone: () => ({
        ok: status >= 200 && status < 300,
        status,
        statusText: FetchMock.getStatusText(status),
        headers: {
          get: (name) => headersMap.get(name) || null,
          has: (name) => headersMap.has(name),
          entries: () => headersMap.entries(),
          forEach: (callback) => headersMap.forEach(callback),
          keys: () => headersMap.keys(),
          values: () => headersMap.values(),
        },
        text: async () => {
          if (body === null || body === undefined) return "";
          if (typeof body === "string") return body;
          return JSON.stringify(body);
        },
        json: async () => {
          if (body === null || body === undefined) return null;
          if (typeof body === "string") return JSON.parse(body);
          return body;
        },
      }),
    };

    return response;
  }

  findMatchingResponse(url, options) {
    const index = this.mockResponses.findIndex((mock) => {
      if (mock.url !== url) return false;
      if (mock.method && mock.method.toLowerCase() !== (options.method || "get").toLowerCase()) return false;

      // Check headers if specified
      if (mock.reqheaders) {
        const entries = Object.entries(mock.reqheaders);
        const requestHeaders = options.headers || {};

        // Create a case-insensitive headers object
        const normalizedRequestHeaders = {};
        Object.keys(requestHeaders).forEach((key) => {
          normalizedRequestHeaders[key.toLowerCase()] = requestHeaders[key];
        });

        const hasAllHeaders = entries.every(([key, value]) => {
          const normalizedKey = key.toLowerCase();
          return normalizedRequestHeaders[normalizedKey] === value;
        });

        if (!hasAllHeaders) return false;
      }

      // Check body if specified
      if (mock.body) {
        const requestBody = options.body;
        const mockBody = typeof mock.body === "string" ? mock.body : JSON.stringify(mock.body);
        const contentType = (options.headers && (options.headers["Content-Type"] || options.headers["content-type"])) || "";
        // If form-encoded, compare as objects
        if (contentType.includes("application/x-www-form-urlencoded")) {
          try {
            const parsedRequest = qs.parse(requestBody);
            const parsedMock = qs.parse(mockBody);
            if (!deepEqual(parsedRequest, parsedMock)) {
              return false;
            }
          } catch (e) {
            // fallback to string compare if parsing fails
            if (requestBody !== mockBody) {
              return false;
            }
          }
        } else {
          // Try to parse both as JSON
          let isJson = false;
          let parsedRequestBody;
          let parsedMockBody;
          try {
            parsedRequestBody = JSON.parse(requestBody);
            parsedMockBody = JSON.parse(mockBody);
            isJson = true;
          } catch (e) {
            isJson = false;
          }
          if (isJson && !deepEqual(parsedRequestBody, parsedMockBody)) {
            return false;
          }
          if (!isJson && requestBody !== mockBody) {
            return false;
          }
        }
      }

      return true;
    });

    if (index === -1) return null;

    // Remove the mock if it's not persistent
    const mock = this.mockResponses[index];
    if (!mock.persist) {
      this.mockResponses.splice(index, 1);
    }

    return mock.response;
  }

  static getStatusText(status) {
    const statusTexts = {
      200: "OK",
      201: "Created",
      204: "No Content",
      240: "OK",
      401: "Unauthorized",
      500: "Internal Server Error",
    };
    return statusTexts[status] || "Unknown";
  }

  mockPost(url, body, response, options = {}) {
    this.mockResponses.push({
      url,
      method: "POST",
      body,
      reqheaders: options.reqheaders,
      persist: options.persist,
      response,
    });
    return this;
  }

  reset() {
    this.mockResponses = [];
    this.fetchSpy.mockClear();
  }

  done() {
    // Only throw for unused mocks that are not persistent
    const unused = this.mockResponses.filter((m) => !m.persist);
    if (unused.length > 0) {
      throw new Error(`Unused mocks: ${unused.map((m) => `${m.method} ${m.url}`).join(", ")}`);
    }
  }
}

function createAuthorizationServer(authorizationServerUrl) {
  const fetchMock = new FetchMock();

  function tokenSuccessWithCustomPath(path, scopeOptions, params) {
    const url = `${authorizationServerUrl}${path}`;

    // Handle both JSON and form-encoded formats
    const bodies = [];

    // Add form-encoded version using qs.stringify to match the library
    bodies.push(qs.stringify(params));

    // Add JSON version if it has JSON content type
    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    // Mock both possible body formats
    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 200,
          body: accessToken,
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenSuccess(scopeOptions, params) {
    return tokenSuccessWithCustomPath("/oauth/token", scopeOptions, params);
  }

  function tokenError(scopeOptions, params) {
    const url = `${authorizationServerUrl}/oauth/token`;

    // Handle both JSON and form-encoded formats
    const bodies = [];
    bodies.push(qs.stringify(params));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 500,
          body: Boom.badImplementation().output.payload,
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenAuthorizationError(scopeOptions, params) {
    const url = `${authorizationServerUrl}/oauth/token`;

    // Handle both JSON and form-encoded formats
    const bodies = [];
    bodies.push(qs.stringify(params));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 401,
          body: Boom.unauthorized().output.payload,
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenRevokeSuccess(scopeOptions, params) {
    const url = `${authorizationServerUrl}/oauth/revoke`;

    // Handle both JSON and form-encoded formats
    const bodies = [];
    bodies.push(qs.stringify(params));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 240,
          body: {},
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenRevokeSuccessWithCustomPath(path, scopeOptions, params) {
    const url = `${authorizationServerUrl}${path}`;

    // Handle both JSON and form-encoded formats
    const bodies = [];
    bodies.push(qs.stringify(params));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 204,
          body: {},
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenRevokeError(scopeOptions, params) {
    const url = `${authorizationServerUrl}/oauth/revoke`;

    // Handle both JSON and form-encoded formats
    const bodies = [];
    bodies.push(qs.stringify(params));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 500,
          body: Boom.badImplementation().output.payload,
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenRevokeAllSuccess(scopeOptions, accessTokenParams, refreshTokenParams) {
    const url = `${authorizationServerUrl}/oauth/revoke`;

    // Handle both JSON and form-encoded formats
    const accessBodies = [];
    const refreshBodies = [];

    accessBodies.push(qs.stringify(accessTokenParams));
    refreshBodies.push(qs.stringify(refreshTokenParams));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      accessBodies.push(JSON.stringify(accessTokenParams));
      refreshBodies.push(JSON.stringify(refreshTokenParams));
    }

    accessBodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 204,
          body: {},
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    refreshBodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 204,
          body: {},
          headers: { "Content-Type": "application/json" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  function tokenSuccessWithNonJSONContent(scopeOptions, params) {
    const url = `${authorizationServerUrl}/oauth/token`;

    // Handle both JSON and form-encoded formats
    const bodies = [];
    bodies.push(qs.stringify(params));

    if (scopeOptions?.reqheaders?.["Content-Type"] === "application/json") {
      bodies.push(JSON.stringify(params));
    }

    bodies.forEach((body) => {
      fetchMock.mockPost(
        url,
        body,
        {
          status: 200,
          body: "<html>Sorry for not responding with a json response</html>",
          headers: { "Content-Type": "application/html" },
        },
        { ...scopeOptions, persist: true }
      );
    });

    return fetchMock;
  }

  return {
    tokenError,
    tokenAuthorizationError,
    tokenRevokeError,
    tokenRevokeSuccess,
    tokenRevokeAllSuccess,
    tokenRevokeSuccessWithCustomPath,
    tokenSuccessWithNonJSONContent,
    tokenSuccessWithCustomPath,
    tokenSuccess,
    fetchMock,
  };
}

function getAccessToken() {
  return accessToken;
}

export { getAccessToken, createAuthorizationServer, FetchMock };
