import {
  describe, it, expect, beforeEach, afterEach, vi
} from "vitest";
import Client from "../lib/client/client.js";
import { createModuleConfig } from "./_module-config.js";
import { FetchMock } from "./_fetch-mock.js";

const TEST_URL = "/oauth/token";
const TEST_PAYLOAD = { foo: "bar" };

function makePayload() {
  return JSON.stringify(TEST_PAYLOAD);
}

describe("Client retry logic", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = new FetchMock();
    vi.stubGlobal("fetch", fetchMock.fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries up to 3 times and succeeds on the last attempt", async () => {
    // First two attempts: 500, last: 200
    fetchMock.mockResponses = [
      {
        url: "https://authorization-server.org/oauth/token",
        method: "post",
        response: { status: 501, body: { error: "server error" } },
      },
      {
        url: "https://authorization-server.org/oauth/token",
        method: "post",
        response: { status: 502, body: { error: "bad gateway" } },
      },
      {
        url: "https://authorization-server.org/oauth/token",
        method: "post",
        response: { status: 200, body: { access_token: "abc123" } },
      },
    ];

    const config = createModuleConfig({
      options: {
        bodyFormat: "json",
      },
    });
    const client = new Client(config);
    const result = await client.request(TEST_URL, {}, { payload: makePayload() });
    expect(result).toEqual({ access_token: "abc123" });
    expect(fetchMock.fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("throws after 3 retries if all attempts return 500+ errors", async () => {
    fetchMock.mockResponses = [
      {
        url: "https://authorization-server.org/oauth/token",
        method: "post",
        response: { status: 501, body: { error: "server error" } },
      },
      {
        url: "https://authorization-server.org/oauth/token",
        method: "post",
        response: { status: 503, body: { error: "unavailable" } },
      },
      {
        url: "https://authorization-server.org/oauth/token",
        method: "post",
        response: { status: 504, body: { error: "timeout" } },
      },
    ];

    const config = createModuleConfig({
      options: {
        bodyFormat: "json",
      },
    });
    const client = new Client(config);
    await expect(client.request(TEST_URL, {}, { payload: makePayload() })).rejects.toThrow();
    expect(fetchMock.fetchSpy).toHaveBeenCalledTimes(4);
  });
});
