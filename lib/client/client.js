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

  // Helper to build request URL
  #buildRequestUrl(url, options) {
    return new URL(options.url || url, this.#httpOptions.baseUrl).href;
  }

  // Helper to extract headers as object
  static #extractHeaders(response) {
    return Object.fromEntries(response?.headers?.entries() || []);
  }

  // Helper to throw a detailed error
  static #throwDetailedError({
    message, status, headers, payload, reqHeaders, reqUrl, bodyText, abort = false
  }) {
    const error = abort
      ? new AbortError(message + (bodyText ? ` ${bodyText}` : ""))
      : new Error(message + (bodyText ? ` ${bodyText}` : ""));
    if (status) error.status = status;
    error.headers = headers;
    error.request_payload = payload;
    error.request_headers = reqHeaders;
    error.request_url = reqUrl;
    throw error;
  }

  async request(url, params, opts) {
    const requestOptions = new RequestOptions(this.#config, params);
    const options = deepmerge(this.#httpOptions, requestOptions.toObject(opts));
    const requestUrl = this.#buildRequestUrl(url, options);

    console.log("Creating request to: (POST) %s", url);
    console.log("Using request options: %j", options);

    let response = null;
    let headersObj = {};

    response = await pRetry(
      async () => {
        try {
          response = await fetch(requestUrl, {
            method: "post",
            headers: options.headers,
            body: options.payload,
          });
        } catch (err) {
          Client.#throwDetailedError({
            message: `Failed to create access token: ${err.message}`,
            payload: options.payload,
            reqHeaders: options.headers,
            reqUrl: options.url,
            abort: true,
          });
        }

        headersObj = Client.#extractHeaders(response);

        if (!response.ok) {
          const bodyText = await response.text();
          const message = `Failed to create access token: ${response.status} ${response.statusText}`;
          if (response.status > 500) {
            Client.#throwDetailedError({
              message,
              status: response.status,
              headers: headersObj,
              payload: options.payload,
              reqHeaders: options.headers,
              reqUrl: requestUrl,
              bodyText,
            });
          }
          Client.#throwDetailedError({
            message,
            status: response.status,
            headers: headersObj,
            payload: options.payload,
            reqHeaders: options.headers,
            reqUrl: requestUrl,
            bodyText,
            abort: true,
          });
        }
        return response;
      },
      {
        retries: 3,
        maxTimeout: 5000,
      }
    );

    headersObj = Client.#extractHeaders(response);
    const bodyText = await response?.text();
    try {
      return JSON.parse(bodyText);
    } catch (e) {
      Client.#throwDetailedError({
        message: "Failed to parse response body as JSON:",
        headers: headersObj,
        payload: options.payload,
        reqHeaders: options.headers,
        reqUrl: options.url,
        bodyText,
      });
    }
    // Fallback return to satisfy ESLint, should never reach here
    return undefined;
  }
}

export default Client;
