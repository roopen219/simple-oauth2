import { DateTime } from "luxon";
import debugLib from "debug";

const debug = debugLib("simple-oauth2:access-token");

const EXPIRES_AT_PROPERTY_NAME = "expires_at";
const EXPIRES_IN_PROPERTY_NAME = "expires_in";
const CREATION_DATE_PROPERTY_NAME = "created_at";

function getExpirationDate(expiresIn, creationDate) {
  let dateToUse = Date.now();
  if (creationDate) {
    if (typeof creationDate === "number") {
      dateToUse = creationDate * 1000;
    } else {
      const dateTime = DateTime.fromISO(creationDate);
      if (dateTime.isValid) {
        dateToUse = dateTime.toMillis();
      }
    }
  }
  return new Date(dateToUse + Number.parseInt(expiresIn, 10) * 1000);
}

function parseExpirationDate(expirationDate) {
  if (expirationDate instanceof Date) {
    return expirationDate;
  }

  // UNIX timestamp
  if (typeof expirationDate === "number") {
    return new Date(expirationDate * 1000);
  }

  // ISO 8601 string
  return new Date(expirationDate);
}

export default function parseToken(token) {
  const tokenProperties = {};

  if (EXPIRES_AT_PROPERTY_NAME in token && token[EXPIRES_AT_PROPERTY_NAME]) {
    tokenProperties[EXPIRES_AT_PROPERTY_NAME] = parseExpirationDate(
      token[EXPIRES_AT_PROPERTY_NAME],
      token[CREATION_DATE_PROPERTY_NAME],
    );
  } else if (EXPIRES_IN_PROPERTY_NAME in token && parseInt(token[EXPIRES_IN_PROPERTY_NAME], 10)) {
    tokenProperties[EXPIRES_AT_PROPERTY_NAME] = getExpirationDate(
      token[EXPIRES_IN_PROPERTY_NAME],
      token[CREATION_DATE_PROPERTY_NAME],
    );
  } else {
    debug("No token expiration property was found. Ignoring date parsing");
  }

  return {
    ...token,
    ...tokenProperties,
  };
}
