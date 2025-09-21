/* eslint-disable import/no-extraneous-dependencies */

const path = require("path");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const middleware = require("i18next-http-middleware");

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "ar", "ar-EG"],
    ns: ["common"],
    defaultNS: "common",

    preload: ["en", "ar"],
    load: "currentOnly",

    backend: {
      loadPath: path.join(__dirname, "..", "locales", "{{lng}}", "{{ns}}.json"),
      addPath: path.join(
        __dirname,
        "..",
        "locales",
        "{{lng}}",
        "{{ns}}.missing.json"
      ),
    },
    detection: {
      order: ["cookie", "header", "querystring"],

      caches: ["cookie"],
      lookupCookie: "language",
      lookupQuerystring: "lang",
      lookupHeader: "accept-language",

      cookieOptions: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },

    interpolation: {
      escapeValue: false,
    },

    // debug: process.env.NODE_ENV === "dev",

    debug: false,
    saveMissing: true,
    saveMissingTo: "current",
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`⚠️ Missing translation: ${lng}.${ns}.${key}`);
      return fallbackValue;
    },
  });

const i18nextMiddleware = middleware.handle(i18next);

const validatorMessage =
  (key, params = {}) =>
  (value, { req }) =>
    req.t(key, params);

module.exports = { i18next, i18nextMiddleware, validatorMessage };
