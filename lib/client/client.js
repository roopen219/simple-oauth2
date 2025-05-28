"use strict";

const deepmerge = require("deepmerge");
const debug = require("debug")("simple-oauth2:client");
const { RequestOptions } = require("./request-options");
const pRetry = require("p-retry");

const defaultHttpHeaders = {
  Accept: "application/json",
};

const defaultHttpOptions = {
  json: "strict",
  headers: defaultHttpHeaders,
};

module.exports = class Client {
  #config = null;
  #httpOptions = null;

  constructor(config) {
    const configHttpOptions = deepmerge(config.http || {}, {
      baseUrl: config.auth.tokenHost,
    });

    const httpOptions = deepmerge(defaultHttpOptions, configHttpOptions);

    this.#config = config;
    this.#httpOptions = httpOptions;
  }

  async request(url, params, opts) {
    const requestOptions = new RequestOptions(this.#config, params);
    const options = deepmerge(this.#httpOptions, requestOptions.toObject(opts));

    debug("Creating request to: (POST) %s", url);
    debug("Using request options: %j", options);

    const requestUrl = new URL(options.url || url, this.#httpOptions.baseUrl).href;

    const response = await pRetry(
      async () => {
        const response = await fetch(requestUrl, {
          method: "post",
          headers: options.headers,
          body: options.payload,
        });

        if (!response.ok) {
          if (response.status > 500) {
            throw new Error(response.statusText);
          }
          const bodyText = await response.text();
          const error = new pRetry.AbortError(
            `Failed to create access token: ${response.status} ${response.statusText} ${bodyText}`
          );
          error.status = response.status;
          error.headers = headersObj;
          error.request_payload = options.payload;
          error.request_headers = options.headers;
          error.request_url = requestUrl;
          throw error;
        }

        return response;
      },
      {
        retries: 3,
        maxTimeout: 5000,
      }
    );

    const headersObj = Object.fromEntries(response.headers.entries());

    const bodyText = await response.text();
    try {
      const body = JSON.parse(bodyText);
      return body;
    } catch (e) {
      const error = new Error(`Failed to parse response body as JSON: ${bodyText}`);
      error.headers = headersObj;
      error.request_payload = options.payload;
      error.request_headers = options.headers;
      error.request_url = options.url;
      throw error;
    }
  }
};
