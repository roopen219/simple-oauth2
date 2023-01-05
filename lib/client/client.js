'use strict';

const deepmerge = require('deepmerge');
const debug = require('debug')('simple-oauth2:client');
const { RequestOptions } = require('./request-options');

const defaultHttpHeaders = {
  Accept: 'application/json',
};

const defaultHttpOptions = {
  json: 'strict',
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

    debug('Creating request to: (POST) %s', url);
    debug('Using request options: %j', options);

    const response = await fetch(
      new URL(options.url || url, this.#httpOptions.baseUrl),
      { method: 'post', headers: options.headers, body: options.payload },
    );

    const body = await response.json();
    return body;
  }
};
