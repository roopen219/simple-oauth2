import { describe, it, expect } from "vitest";

import { ResourceOwnerPassword, ClientCredentials, AuthorizationCode } from "../index.js";
import { createModuleConfig } from "./_module-config.js";

describe("OAuth2 @constructor", () => {
  it("throws a validation error when no configuration is provided", () => {
    expect(() => new ResourceOwnerPassword()).toThrow();
    expect(() => new ClientCredentials()).toThrow();
    expect(() => new AuthorizationCode()).toThrow();
  });

  it("throws a validation error when http.baseUrl is provided", () => {
    const options = createModuleConfig({
      http: {
        baseUrl: "",
      },
    });

    expect(() => new ResourceOwnerPassword(options)).toThrow(/not allowed/);
    expect(() => new ClientCredentials(options)).toThrow(/not allowed/);
    expect(() => new AuthorizationCode(options)).toThrow(/not allowed/);
  });

  it("creates a new instance with the minimal required configuration", () => {
    const config = createModuleConfig();

    expect(() => new ResourceOwnerPassword(config)).not.toThrow();
    expect(() => new ClientCredentials(config)).not.toThrow();
    expect(() => new AuthorizationCode(config)).not.toThrow();
  });

  it("creates a new instance with empty credentials", () => {
    const config = createModuleConfig({
      client: {
        id: "",
        secret: "",
      },
    });

    expect(() => new ResourceOwnerPassword(config)).not.toThrow();
    expect(() => new ClientCredentials(config)).not.toThrow();
    expect(() => new AuthorizationCode(config)).not.toThrow();
  });

  it("creates a new instance with visual non-control characters", () => {
    const config = createModuleConfig({
      client: {
        id: "\x20hello\x7E",
        secret: "\x20world\x7E",
      },
    });

    expect(() => new ResourceOwnerPassword(config)).not.toThrow();
    expect(() => new ClientCredentials(config)).not.toThrow();
    expect(() => new AuthorizationCode(config)).not.toThrow();
  });
});
