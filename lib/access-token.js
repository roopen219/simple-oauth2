import GrantTypeParams from "./grant-type-params.js";
import parseToken, { EXPIRES_IN_PROPERTY_NAME } from "./access-token-parser.js";

const ACCESS_TOKEN_PROPERTY_NAME = "access_token";
const REFRESH_TOKEN_PROPERTY_NAME = "refresh_token";

export default class AccessToken {
  #config = null;
  #client = null;

  constructor(config, client, token) {
    // assert(config, 'Cannot create access token without client configuration');
    // assert(client, 'Cannot create access token without client instance');
    // assert(token, 'Cannot create access token without a token to parse');

    this.#config = config;
    this.#client = client;
    this.token = Object.freeze(parseToken(token, this.#config.options));
  }

  /**
   * Determines if the current access token has already expired or if it is about to expire
   *
   * @param {Number} expirationWindowSeconds Window of time before the actual expiration to refresh the token
   * @returns {Boolean}
   */
  expired(expirationWindowSeconds = 0) {
    return this.token.expires_at ? this.token.expires_at - (Date.now() + expirationWindowSeconds * 1000) <= 0 : false;
  }

  /**
   * Refreshes the current access token
   *
   * @param {Object} params Optional argument for additional API request params.
   * @param {String|Array<String>} [params.scope] String or array of strings representing the application privileges
   * @param {Object} [httpOptions] Optional http options passed through the underlying http library
   * @returns {Promise<AccessToken>}
   */
  async refresh(params = {}, httpOptions = {}, tokenExpiryDuration) {
    const refreshParams = {
      ...params,
      refresh_token: this.token.refresh_token,
    };

    const parameters = GrantTypeParams.forGrantType(REFRESH_TOKEN_PROPERTY_NAME, this.#config.options, refreshParams);
    const response = await this.#client.request(this.#config.auth.refreshPath, parameters.toObject(), httpOptions);
    const expiresInKey = this.#config.options.expiresInPropertyName || EXPIRES_IN_PROPERTY_NAME;

    return new AccessToken(this.#config, this.#client, {
      ...response,
      expires_in: response[expiresInKey] || tokenExpiryDuration,
    });
  }

  /**
   * Revokes either the access or refresh token depending on the {tokenType} value
   *
   * @param  {String} tokenType A string containing the type of token to revoke (access_token or refresh_token)
   * @param {Object} [httpOptions] Optional http options passed through the underlying http library
   * @returns {Promise}
   */
  async revoke(tokenType, httpOptions) {
    // assert(
    //   tokenType === ACCESS_TOKEN_PROPERTY_NAME || tokenType === REFRESH_TOKEN_PROPERTY_NAME,
    //   `Invalid token type. Only ${ACCESS_TOKEN_PROPERTY_NAME} or ${REFRESH_TOKEN_PROPERTY_NAME} are valid values`,
    // );

    const options = {
      token: this.token[tokenType],
      token_type_hint: tokenType,
    };

    return this.#client.request(this.#config.auth.revokePath, options, httpOptions);
  }

  /**
   * Revokes both the current access and refresh tokens
   *
   * @param {Object} [httpOptions] Optional http options passed through the underlying http library
   * @returns {Promise}
   */
  async revokeAll(httpOptions) {
    await this.revoke(ACCESS_TOKEN_PROPERTY_NAME, httpOptions);
    await this.revoke(REFRESH_TOKEN_PROPERTY_NAME, httpOptions);
  }

  /**
   * Get the access token's internal JSON representation
   *
   * @returns {String}
   */
  toJSON() {
    return this.token;
  }
}
