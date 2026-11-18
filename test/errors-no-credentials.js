/* global Headers, Response */
import {
  describe, it, expect, afterEach, vi
} from "vitest";
import {
  AuthorizationCode, ClientCredentials, KekaApiCode, ResourceOwnerPassword
} from "../index.js";
import { createModuleConfig } from "./_module-config.js";

const SECRET = "the-client-secret-value";
const CODE = "the-authorization-code-value";
const TOKEN = "the-access-token-value";

function errorText(error) {
  const seen = new Set();
  const walk = (value) => {
    if (value === null || typeof value !== "object" || seen.has(value)) return [];
    seen.add(value);
    return Object.getOwnPropertyNames(value).flatMap((key) => {
      const v = value[key];
      if (typeof v === "string") return [v];
      if (v instanceof Headers || v instanceof Response) return [];
      return walk(v);
    });
  };
  return [String(error.message), ...walk(error)].join("\n");
}

function oauth2() {
  return new AuthorizationCode(createModuleConfig({
    client: { secret: SECRET },
    options: { authorizationMethod: "body" },
  }));
}

describe("OAuth2 errors carry no credentials", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an http error (400) keeps the request body, headers and URL off the error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{\"error\":\"invalid_grant\"}", { status: 400 })));

    const error = await oauth2().getToken({ code: CODE, redirect_uri: "http://callback.com" }).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    const text = errorText(error);
    expect(text).toContain("invalid_grant");
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(CODE);
  });

  it("a token response that is not JSON keeps its body out of the error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`access_token=${TOKEN}&token_type=bearer`, { status: 200 })));

    const error = await oauth2().getToken({ code: CODE, redirect_uri: "http://callback.com" }).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/^Failed to parse response body as JSON/);
    const text = errorText(error);
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain(CODE);
  });
});

describe("Refused options carry no values", () => {
  const grantTypes = [AuthorizationCode, ClientCredentials, KekaApiCode, ResourceOwnerPassword];
  const refuse = (GrantType, config) => {
    try {
      return new GrantType(createModuleConfig(config));
    } catch (error) {
      return error;
    }
  };

  it("a client secret with a line break is named, not quoted", () => {
    grantTypes.forEach((GrantType) => {
      const error = refuse(GrantType, { client: { secret: `${SECRET}\n` } });

      expect(error.message).toBe("Invalid options provided to simple-oauth2 \"client.secret\" must contain only printable ASCII characters");
      expect(errorText(error)).not.toContain(SECRET);
    });
  });

  it("another refused option leaves the options, secret included, off the error", () => {
    grantTypes.forEach((GrantType) => {
      const error = refuse(GrantType, { client: { secret: SECRET }, auth: { tokenHost: "not-a-uri" } });

      expect(error.message).toBe("Invalid options provided to simple-oauth2 \"auth.tokenHost\" must be a valid uri with a scheme matching the http|https pattern");
      const text = errorText(error);
      expect(text).not.toContain(SECRET);
      expect(text).not.toContain("not-a-uri");
    });
  });
});
