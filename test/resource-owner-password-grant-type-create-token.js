import { describe, it, expect } from "vitest";
import { ResourceOwnerPassword } from "../index.js";
import AccessToken from "../lib/access-token.js";
import { createModuleConfig } from "./_module-config.js";
import { getAccessToken } from "./_fetch-mock.js";

describe("ResourceOwnerPassword @createToken", () => {
  it("creates a new access token instance from a JSON object", async () => {
    const oauth2 = new ResourceOwnerPassword(createModuleConfig());
    const accessToken = oauth2.createToken(getAccessToken());

    expect(accessToken).toBeInstanceOf(AccessToken);
  });
});
