'use strict';

const deepmerge = require('deepmerge');
const debug = require('debug')('simple-oauth2:client');
const pretry = require('p-retry');
const { RequestOptions } = require('./request-options');

const { AbortError } = pretry;
const pRetry = pretry.default;

const defaultHttpHeaders = {
  Accept: 'application/json',
};

const defaultHttpOptions = {
  json: 'strict', headers: defaultHttpHeaders,
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

    debug('Creating request to: (POST) %s', url);
    debug('Using request options: %j', options);

    return pRetry(async () => {
      const response = await fetch(new URL(options.url || url, this.#httpOptions.baseUrl).href, {
        method: 'post',
        headers: options.headers,
        body: options.payload,
      });
      if (!response.ok && response.status < 500) {
        const text = await response.text();
        throw new AbortError(`Request failed with status code ${response.status}: ${text}`);
      }
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed with status code ${response.status}: ${text}`);
      }
      return response.json();
    }, {
      retries: 3,
      maxTimeout: 5000,
    });
  }
};
