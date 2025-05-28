"use strict";

import Joi from "joi";
import { Client } from "./lib/client/index.js";
import AuthorizationCodeGrantType from "./lib/authorization-code-grant-type.js";
import ResourceOwnerPasswordGrantType from "./lib/resource-owner-password-grant-type.js";
import ClientCredentialsGrantType from "./lib/client-credentials-grant-type.js";
import KekaApiGrantType from "./lib/kekaapi-grant-type.js";
import { AuthorizationCodeSchema, ClientCredentialsSchema, ResourceOwnerPasswordSchema } from "./lib/config.js";

class AuthorizationCode extends AuthorizationCodeGrantType {
  constructor(options) {
    const config = Joi.attempt(options, AuthorizationCodeSchema, "Invalid options provided to simple-oauth2");
    const client = new Client(config);

    super(config, client);
  }
}

class KekaApiCode extends KekaApiGrantType {
  constructor(options) {
    const config = Joi.attempt(options, AuthorizationCodeSchema, "Invalid options provided to simple-oauth2");
    const client = new Client(config);

    super(config, client);
  }
}

class ClientCredentials extends ClientCredentialsGrantType {
  constructor(options) {
    const config = Joi.attempt(options, ClientCredentialsSchema, "Invalid options provided to simple-oauth2");
    const client = new Client(config);

    super(config, client);
  }
}

class ResourceOwnerPassword extends ResourceOwnerPasswordGrantType {
  constructor(options) {
    const config = Joi.attempt(options, ResourceOwnerPasswordSchema, "Invalid options provided to simple-oauth2");
    const client = new Client(config);

    super(config, client);
  }
}

export { ResourceOwnerPassword, ClientCredentials, AuthorizationCode, KekaApiCode };
