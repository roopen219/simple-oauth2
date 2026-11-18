import Joi from "joi";
import { authorizationMethodEnum, bodyFormatEnum, credentialsEncodingModeEnum } from "./client/index.js";

// https://tools.ietf.org/html/draft-ietf-oauth-v2-31#appendix-A.1
const vsCharRegEx = /^[\x20-\x7E]*$/;

const ClientSchema = Joi.object({
  id: Joi.string().pattern(vsCharRegEx).allow(""),
  secret: Joi.string().pattern(vsCharRegEx).allow(""),
  secretParamName: Joi.string().default("client_secret"),
  idParamName: Joi.string().default("client_id"),
})
  .required()
  .unknown(true);

const AuthSchema = Joi.object()
  .keys({
    tokenHost: Joi.string()
      .required()
      .uri({ scheme: ["http", "https"] }),
    tokenPath: Joi.string().default("/oauth/token"),
    refreshPath: Joi.string().default(Joi.ref("tokenPath")),
    revokePath: Joi.string().default("/oauth/revoke"),
  })
  .required()
  .unknown(true);

const OptionsSchema = Joi.object({
  scopeSeparator: Joi.string().default(" "),
  credentialsEncodingMode: Joi.string()
    .valid(...Object.values(credentialsEncodingModeEnum))
    .default(credentialsEncodingModeEnum.STRICT),
  bodyFormat: Joi.string()
    .valid(...Object.values(bodyFormatEnum))
    .default(bodyFormatEnum.FORM),
  authorizationMethod: Joi.string()
    .valid(...Object.values(authorizationMethodEnum))
    .default(authorizationMethodEnum.HEADER),
})
  .default()
  .unknown(true);

const HttpOptionsSchema = Joi.object({
  baseUrl: Joi.string().forbidden(),
}).unknown(true);

const AuthorizationCodeSchema = Joi.object({
  client: ClientSchema,
  auth: AuthSchema.keys({
    authorizeHost: Joi.string()
      .uri({ scheme: ["http", "https"] })
      .default(Joi.ref("tokenHost")),
    authorizePath: Joi.string().default("/oauth/authorize"),
  }),
  http: HttpOptionsSchema,
  options: OptionsSchema,
}).unknown(true);

const ClientCredentialsSchema = Joi.object({
  client: ClientSchema,
  auth: AuthSchema,
  http: HttpOptionsSchema,
  options: OptionsSchema,
}).unknown(true);

const ResourceOwnerPasswordSchema = Joi.object({
  client: ClientSchema,
  auth: AuthSchema,
  http: HttpOptionsSchema,
  options: OptionsSchema,
}).unknown(true);

// A refused option in fixed words. joi's own error quotes the value it refused
// (in its message, `details` and `_original`), and a client secret is one.
const reasons = {
  "any.required": "is required",
  "any.unknown": "is not allowed",
  "any.only": "must be one of the allowed values",
  "object.base": "must be of type object",
  "string.base": "must be a string",
  "string.empty": "is not allowed to be empty",
  "string.pattern.base": "must contain only printable ASCII characters",
  "string.uriCustomScheme": "must be a valid uri with a scheme matching the http|https pattern",
};

// Validates and defaults the options. The error names the field and the rule,
// never the value or the options.
function validateOptions(options, schema) {
  const { error, value } = schema.validate(options);
  if (error) {
    const [{ path, type }] = error.details;
    throw new Error(`Invalid options provided to simple-oauth2 "${path.join(".") || "value"}" ${reasons[type] || `is invalid (${type})`}`);
  }
  return value;
}

export {
  AuthorizationCodeSchema, ClientCredentialsSchema, ResourceOwnerPasswordSchema, validateOptions,
};
