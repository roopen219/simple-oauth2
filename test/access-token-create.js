import { describe, it, expect } from "vitest";
import {
  isEqual, isValid, isDate, differenceInSeconds
} from "date-fns";

import Chance from "./_chance.js";
import AccessToken from "../lib/access-token.js";
import { Client } from "../lib/client/index.js";
import { has, hasIn } from "./_property.js";
import { createModuleConfigWithDefaults as createModuleConfig } from "./_module-config.js";

const chance = new Chance();

describe("AccessToken @create", () => {
  it("throws an error when no token payload is provided", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    expect(() => new AccessToken(config, client)).toThrow();
  });

  it("creates a new access token instance", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken();
    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(accessToken).toBeTruthy();
    expect(has(accessToken, "token")).toBe(true);
    expect(hasIn(accessToken, "refresh")).toBe(true);
    expect(hasIn(accessToken, "revoke")).toBe(true);
    expect(hasIn(accessToken, "expired")).toBe(true);
  });

  it("do not reassigns the expires at property when is already a date", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expired: true,
      dateFormat: "date",
      expireMode: "expires_at",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(isDate(accessToken.token.expires_at)).toBe(true);
    expect(isValid(accessToken.token.expires_at)).toBe(true);
  });

  it("parses the expires at property when is UNIX timestamp in seconds", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expired: true,
      dateFormat: "unix",
      expireMode: "expires_at",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(isDate(accessToken.token.expires_at)).toBe(true);
    expect(isValid(accessToken.token.expires_at)).toBe(true);
  });

  it("parses the expires at property when is ISO time", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expired: true,
      dateFormat: "iso",
      expireMode: "expires_at",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(isDate(accessToken.token.expires_at)).toBe(true);
    expect(isValid(accessToken.token.expires_at)).toBe(true);
  });

  it("computes the expires at property when only expires in is present", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "expires_in",
    });

    const today = new Date();
    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(isDate(accessToken.token.expires_at)).toBe(true);
    expect(isValid(accessToken.token.expires_at)).toBe(true);

    const diffInSeconds = differenceInSeconds(accessToken.token.expires_at, today);

    expect(diffInSeconds).toBe(accessTokenResponse.expires_in);
  });

  it("ignores the expiration parsing when no expiration property is present", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken({
      expireMode: "no_expiration",
    });

    const accessToken = new AccessToken(config, client, accessTokenResponse);

    expect(has(accessToken.token, "expires_in")).toBe(false);
    expect(has(accessToken.token, "expires_at")).toBe(false);
  });
});

describe("AccessToken @toJSON", () => {
  it("serializes the access token information in an equivalent format", () => {
    const config = createModuleConfig();
    const client = new Client(config);

    const accessTokenResponse = chance.accessToken();

    const accessToken = new AccessToken(config, client, accessTokenResponse);
    const restoredAccessToken = new AccessToken(config, client, JSON.parse(JSON.stringify(accessToken)));

    expect(restoredAccessToken.token).toEqual(accessToken.token);
    expect(isEqual(restoredAccessToken.token.expires_at, accessToken.token.expires_at)).toBe(true);
  });
});
