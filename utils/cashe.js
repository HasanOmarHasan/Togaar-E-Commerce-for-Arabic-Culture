/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable import/no-extraneous-dependencies */
const { LRUCache }  = require("lru-cache");

const caches = {
  longTermCache_30Days: new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 60 * 24 * 30, // 30 يوم
    maxSize: 1024 * 1024 * 100, // 50MB
    sizeCalculation: (value, key) => {
        console.log(value , key)
         try { return JSON.stringify(value).length; } catch { return 1; }
    },
  }),
  mediumTermCache_7Days: new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 60 * 24 * 7,
    maxSize: 1024 * 1024 * 100, // 200MB
    sizeCalculation: (value, key) => {
        console.log(value , key)
         try { return JSON.stringify(value).length; } catch { return 1; }
    },
  }),
  shortTermCache_20Min: new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 20,
    maxSize: 1024 * 1024 * 100, // حد تقريبي للـ bytes (50MB)
    sizeCalculation: (value, key) => {
        console.log(value , key)
         try { return JSON.stringify(value).length; } catch { return 1; }
    },
  }),
};

const generateCacheKey = (type, key) => `${type}:${key}`;

module.exports = { caches, generateCacheKey };
