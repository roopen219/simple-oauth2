import { describe, it, expect } from "vitest";

import Chance from "./_chance.js";
import AccessToken from "../lib/access-token.js";
import { Client } from "../lib/client/index.js";
import { createModuleConfigWithDefaults as createModuleConfig } from "./_module-config.js";

const chance = new Chance();

describe("AccessToken @expired", () => {
  it("returns true when expired", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expired: true,
      expireMode: "expires_at",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(accessToken.expired()).toBe(true);
  });

  it("returns true if the token is expiring within the expiration window", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = {
      ...chance.accessToken({
        expireMode: "expires_in",
      }),
      expires_in: 10,
    };

    const expirationWindowSeconds = 11;
    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(accessToken.expired(expirationWindowSeconds)).toBe(true);
  });

  it("returns false when not expired", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expired: false,
      expireMode: "expires_at",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(accessToken.expired()).toBe(false);
  });

  it("returns false when no expiration property is present", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "no_expiration",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(accessToken.expired()).toBe(false);
  });
});

describe("AccessToken @custom expiresInPropertyName", () => {
  it("returns true when expired using a custom expiresInPropertyName", () => {
    const customExpiresInPropertyName = "refresh_token_expires_in";
    const config = createModuleConfig({
      options: { expiresInPropertyName: customExpiresInPropertyName },
    });
    const client = new Client(config);
    // Set created_at in the past and expires_in to a small value so it's expired
    const now = Math.floor(Date.now() / 1000) - 20; // 20 seconds ago
    const accessTokenResponse = {
      access_token: "token",
      [customExpiresInPropertyName]: 10, // expires 10 seconds after created_at
      created_at: now,
    };
    const accessToken = new AccessToken(config, client, accessTokenResponse);
    expect(accessToken.expired()).toBe(true);
  });
});
