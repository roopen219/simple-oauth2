import AccessToken from "./access-token.js";
import GrantTypeParams from "./grant-type-params.js";

export default class ResourceOwnerPassword {
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
   * @param {String} params.username A string representing the registered username
   * @param {String} params.password A string representing the registered password
   * @param {String|Array<String>} [params.scope] A String or array of strings representing the application privileges
   * @param {Object} [httpOptions] Optional http options passed through the underlying http library
   * @return {Promise<AccessToken>}
   */
  async getToken(params, httpOptions) {
    const parameters = GrantTypeParams.forGrantType("password", this.#config.options, params);
    const response = await this.#client.request(this.#config.auth.tokenPath, parameters.toObject(), httpOptions);

    return this.createToken(response);
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
