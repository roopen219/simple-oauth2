import deepmerge from "deepmerge";
import pRetry, { AbortError } from "p-retry";
import { RequestOptions } from "./request-options.js";

const defaultHttpHeaders = {
  Accept: "application/json",
};

const defaultHttpOptions = {
  json: "strict",
  headers: defaultHttpHeaders,
};

class Client {
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

    console.log("Creating request to: (POST) %s", url);
    const requestUrl = new URL(options.url || url, this.#httpOptions.baseUrl).href;

    const response = await pRetry(
      async () => {
        const response = await fetch(requestUrl, {
          method: "post",
          headers: options.headers,
          body: options.payload,
        });

        const clonedResponse = response.clone();
        const headersObj = Object.fromEntries(response.headers.entries());

        if (!response.ok) {
          if (response.status > 500) {
            throw new Error(response.statusText);
          }
          const bodyText = await response.text();
          const error = new AbortError(
            `Failed to create access token: ${response.status} ${response.statusText} ${bodyText}`
          );
          error.originalError.status = response.status;
          error.originalError.headers = headersObj;
          error.originalError.response = clonedResponse;
          throw error;
        }

        return response;
      },
      {
        retries: 3,
        maxTimeout: 5000,
      }
    );
    const clonedResponse = response.clone();
    const headersObj = Object.fromEntries(response.headers.entries());

    const bodyText = await response.text();
    try {
      const body = JSON.parse(bodyText);
      return body;
    } catch (e) {
      // The body is left out: a token response that is not JSON can hold the tokens.
      const error = new Error(
        `Failed to parse response body as JSON (status ${response.status}, ${bodyText.length} bytes)`
      );
      error.headers = headersObj;
      error.response = clonedResponse;
      throw error;
    }
  }
}

export default Client;
