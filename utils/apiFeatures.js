const ApiError = require("./ApiError");

class apiFeatures {
  constructor(MongooseQuery, queryStr) {
    this.MongooseQuery = MongooseQuery;
    this.queryStr = queryStr;
    this.filter = {};
  }

  Filter() {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryStringObj = { ...this.queryStr };
    const excludeFields = ["page", "sort", "limit", "fields", "keyword"];
    excludeFields.forEach((field) => delete queryStringObj[field]);

    const allowedOperators = ["gte", "gt", "lte", "lt", "ne", "in"];

    // eslint-disable-next-line no-restricted-syntax
    for (const [key, value] of Object.entries(queryStringObj)) {
      // إزالة المسافات من المفتاح للتعامل مع المشكلة
      const cleanKey = key.replace(/\s+/g, "");
      const match = cleanKey.match(/^(\w+)\[(\w+)\]$/);

      if (match) {
        const field = match[1];
        const operator = match[2];

        if (allowedOperators.includes(operator)) {
          const mongoOperator = `$${operator}`;
          let parsedValue;

          // معالجة خاصة لمشغل in
          if (operator === "in") {
            if (Array.isArray(value))
              parsedValue = value.map((item) => {
                const num = Number(item);
                return isNaN(num) ? item : num;
              });
            else {
              // تحويل القيم المفصولة بفواصل إلى مصفوفة
              parsedValue = value.split(",").map((item) => {
                const num = Number(item);
                return isNaN(num) ? item : num;
              });
            }
          }
          // معالجة خاصة لمشغل ne (لا يساوي)
          else if (operator === "ne") {
            parsedValue = isNaN(value) ? value : Number(value);
          }
          // معالجة المشغلات العددية (gte, gt, lte, lt)
          else {
            parsedValue = isNaN(value) ? value : Number(value);
          }

          if (!this.filter[field]) {
            this.filter[field] = {};
          }

          this.filter[field][mongoOperator] = parsedValue;
        } else {
          // إذا كان المشغل غير مدعوم
          this.filter[cleanKey] = isNaN(value) ? value : Number(value);
        }
      } else {
        // الحقول العادية بدون مشغلات
        this.filter[cleanKey] = isNaN(value) ? value : Number(value);
      }
    }

    this.MongooseQuery = this.MongooseQuery.find(this.filter);
    return this;
  }

  search(modelName) {
    if (this.queryStr.keyword) {
      const searchOptions = this.queryStr.keyword;

      const searchConditions = {};
      if (modelName === "Product") {
        searchConditions.$or = [
          { title: { $regex: searchOptions, $options: "i" } },
          // { description: { $regex: searchOptions, $options: "i" } },
          { title_ar: { $regex: searchOptions, $options: "i" } },
          // { description_ar: { $regex: searchOptions, $options: "i" } },
        ];
      } else {
        searchConditions.$or = [
          { name: { $regex: searchOptions, $options: "i" } },
        ];
      }

      // إزالة keyword من filter إذا كان موجوداً
      // delete this.filter.keyword;

      if (Object.keys(this.filter).length > 0) {
        // إذا كان هناك شروط موجودة بالفعل في filter
        // if (this.filter.$and) {
        //   this.filter.$and.push(searchConditions);
        // } else {
        //   this.filter.$and = [searchConditions];
        // }
        this.MongooseQuery = this.MongooseQuery.find({
          $and: [this.filter, searchConditions],
        });
      } else {
        // إذا كان filter فارغاً
        // Object.assign(this.filter, searchConditions);
        this.MongooseQuery = this.MongooseQuery.find(searchConditions);
      }

      console.log("Search keyword:", searchOptions);
      console.log("Final filter:", JSON.stringify(this.filter, null, 2));
    }
    return this;
  }

  sort() {
    // console.log(this.queryStr.sort)
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.MongooseQuery = this.MongooseQuery.sort(sortBy);
    } else {
      this.MongooseQuery = this.MongooseQuery.sort("-createdAt");
    }
    return this;
  }

  field() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.MongooseQuery = this.MongooseQuery.select(fields);
    } else {
      this.MongooseQuery = this.MongooseQuery.select("-__v");
    }
    return this;
  }

  pagination(countDocuments) {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 20;
    const skip = (page - 1) * limit;
    // const endInedx = page * limit;
    const totalPages = Math.ceil(countDocuments / limit);

    if (page > totalPages && totalPages > 0) {
      throw new ApiError(
        `Page ${page} not found. Available pages: 1 to ${totalPages}`,
        404
      );
    }

    // const pagenations = {};
    // pagenations.currentPage = page;
    // pagenations.limit = limit;
    // pagenations.skip = skip;
    // // pagenations.totalPages = Math.ceil(countDocuments / limit);

    // if (endInedx < countDocuments) {
    //   pagenations.next = page + 1;
    // }
    // if (page > 1 && skip > 0) {
    //   pagenations.prev = page - 1;
    // }
    // Build pagination info
    this.paginationResults = {
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalDocuments: countDocuments,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 && skip > 0 ? page - 1 : null,
      skip: skip,
    };

    this.MongooseQuery = this.MongooseQuery.skip(skip).limit(limit);

    // this.paginationResults = pagenations;
    return this;
  }
}

module.exports = apiFeatures;
