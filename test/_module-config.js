"use strict";

import Hoek from "@hapi/hoek";
import Joi from "joi";
import { AuthorizationCodeSchema } from "../lib/config.js";

const baseConfig = {
  client: {
    id: "the client id",
    secret: "the client secret",
  },
  auth: {
    tokenHost: "https://authorization-server.org",
  },
};

function createModuleConfig(config = {}) {
  return Hoek.applyToDefaults(baseConfig, config);
}

function createModuleConfigWithDefaults(config = {}) {
  return Joi.attempt(createModuleConfig(config), AuthorizationCodeSchema); // any grant type schema works here
}

export { createModuleConfig, createModuleConfigWithDefaults };
