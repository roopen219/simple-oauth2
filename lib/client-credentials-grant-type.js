import AccessToken from "./access-token.js";
import GrantTypeParams from "./grant-type-params.js";

export default class ClientCredentials {
  #config = null;
  #client = null;

  constructor(config, client) {
    this.#config = config;
    this.#client = client;
  }

  /**
   * Requests and returns an access token from the authorization server
   *
   * @param {Object} params
   * @param {String|Array<String>} [params.scope] A String or array of strings representing the application privileges
   * @param {Object} [httpOptions] Optional http options passed through the underlying http library
   * @return {Promise<AccessToken>}
   */
  async getToken(params, httpOptions, tokenExpiryDuration) {
    const parameters = GrantTypeParams.forGrantType("client_credentials", this.#config.options, params);
    const response = await this.#client.request(this.#config.auth.tokenPath, parameters.toObject(), httpOptions);

    return this.createToken({ ...response, expires_in: response.expires_in || tokenExpiryDuration });
  }

  /**
   * Creates a new access token instance from a plain object
   *
   * @param {Object} token Plain object representation of an access token
   * @returns {AccessToken}
   */
  createToken(token) {
    return new AccessToken(this.#config, this.#client, token);
  }
}
