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
