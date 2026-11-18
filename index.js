import { Client } from "./lib/client/index.js";
import AuthorizationCodeGrantType from "./lib/authorization-code-grant-type.js";
import ResourceOwnerPasswordGrantType from "./lib/resource-owner-password-grant-type.js";
import ClientCredentialsGrantType from "./lib/client-credentials-grant-type.js";
import KekaApiGrantType from "./lib/kekaapi-grant-type.js";
import {
  AuthorizationCodeSchema, ClientCredentialsSchema, ResourceOwnerPasswordSchema, validateOptions,
} from "./lib/config.js";

class AuthorizationCode extends AuthorizationCodeGrantType {
  constructor(options) {
    const config = validateOptions(options, AuthorizationCodeSchema);
    const client = new Client(config);

    super(config, client);
  }
}

class KekaApiCode extends KekaApiGrantType {
  constructor(options) {
    const config = validateOptions(options, AuthorizationCodeSchema);
    const client = new Client(config);

    super(config, client);
  }
}

class ClientCredentials extends ClientCredentialsGrantType {
  constructor(options) {
    const config = validateOptions(options, ClientCredentialsSchema);
    const client = new Client(config);

    super(config, client);
  }
}

class ResourceOwnerPassword extends ResourceOwnerPasswordGrantType {
  constructor(options) {
    const config = validateOptions(options, ResourceOwnerPasswordSchema);
    const client = new Client(config);

    super(config, client);
  }
}

export {
  ResourceOwnerPassword, ClientCredentials, AuthorizationCode, KekaApiCode,
};
