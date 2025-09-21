/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable camelcase */
/* eslint-disable no-case-declarations */
const asyncHandler = require("express-async-handler");

const slugify = require("slugify");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/apiFeatures");
const { caches, generateCacheKey } = require("../utils/cashe");

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const document = await Model.findById(id);
    if (!document) {
      return next(
        new ApiError(
          req.t("http.notFound", { field: req.t("model.document"), id }),
          404
        )
      );
    }

    await document.deleteOne();

    caches.shortTermCache_20Min.delete(generateCacheKey("product", id));
    caches.mediumTermCache_7Days.delete("products");

    res.status(204).json({
      status: req.t("http.success"),
      message: req.t("http.deleted", { field: req.t("model.document"), id }),
    });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }
    if (req.body.name) {
      req.body.slug = slugify(req.body.name);
    }
    const docment = await Model.create(req.body);

    caches.mediumTermCache_7Days.delete("products");

    res.status(201).json({ status: req.t("http.success"), data: docment });
  });

exports.updateOne = (Model, allowedFields = []) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const body = {};
    if (Array.isArray(allowedFields) && allowedFields.length > 0) {
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          body[field] = req.body[field];
        }
      });
    } else {
      Object.assign(body, req.body);
    }

    if (body.title) {
      body.slug = slugify(body.title);
    }
    if (body.name) {
      body.slug = slugify(body.name);
    }

    const docment = await Model.findOneAndUpdate({ _id: id }, body, {
      new: true,
      runValidators: true,
    });
    if (!docment) {
      return next(
        new ApiError(
          req.t("http.notFound", { field: req.t("model.document"), id }),
          404
        )
      );
    }

    caches.shortTermCache_20Min.delete(generateCacheKey("product", id));
    caches.mediumTermCache_7Days.delete("products");

    docment.save();
    res.status(200).json({
      status: req.t("http.success"),
      message: req.t("http.updated", { field: req.t("model.document") }),
      data: docment,
    });
  });

exports.getOne = (Model, options = {}) =>
  asyncHandler(async (req, res, next) => {
    const { popOpations = null } = options; // i will use poplate to detact the product , it's use only on product
    const { id } = req.params;
    const productCashKey = generateCacheKey("product", id);

 const getLanguage = () => (req.locale || req.language || "en").toLowerCase();
    
    const localizeProduct = (product, language) => {
      if (!popOpations) return product;
      
      const isArabic = language.startsWith("ar");
      const { title_ar, description_ar, ...rest } = product;
      
      return {
        ...rest,
        title: isArabic && title_ar ? title_ar : product.title,
        description: isArabic && description_ar ? description_ar : product.description
      };
    };

    const userCashKey =
      req.user && req.user._id ? generateCacheKey("user", req.user._id) : null;

    const isCashedRespons = (docment) =>{

      const language = getLanguage(req);
      const localizedDocument = localizeProduct(docment, language);

      res.status(200).json({
        status: req.t("http.success"),
        message: req.t("http.found", { field: req.t("model.document") }),
        isCached: true,
        data:
          req.user && req.user._id
            ? {
                id: docment._id,
                name: docment.name,
                email: docment.email,
                address: req.user.address,
                wishList: req.user.wishList,
                profileImage: docment.profileImage,
                language: req.user.language,
              }
            : localizedDocument,
      });
      }

    // cashing
    if (caches.shortTermCache_20Min.has(productCashKey)) {
      const docment = caches.shortTermCache_20Min.get(productCashKey);
      return isCashedRespons(docment);
    }
    if (caches.longTermCache_30Days.has(userCashKey)) {
      const docment = caches.longTermCache_30Days.get(userCashKey);
      return isCashedRespons(docment);
    }

    // NOTE : lean can be abstacale of working in maddleware or virtuals
    const query = Model.findById(id).lean({ virtuals: true });
    if (popOpations) {
      query.populate(popOpations);
    }

    const docment = await query;
    if (!docment) {
      return next(
        new ApiError(
          req.t("http.notFound", { field: req.t("model.document"), id }),
          404
        )
      );
    }

    caches.shortTermCache_20Min.set(productCashKey, docment);
    caches.longTermCache_30Days.set(userCashKey, docment);


       const language = getLanguage(req);
    const localizedDocument = localizeProduct(docment, language);

    res.status(200).json({
      status: req.t("http.success"),
      message: req.t("http.found", { field: req.t("model.document") }),
      data: localizedDocument,
    });
  });

exports.getAll = (Model, options = {}) =>
  asyncHandler(async (req, res) => {
    const {
      nestedField = null,
      nestedIdParam = null,
      isProduct = false,
      isLoggedUser = false,
    } = options;
    const filter = {};
    const cacheKey = "products";
    const cashConditions = isProduct && Object.keys(req.query).length === 0;
    if (isLoggedUser) {
      if (req.user._id && req.user.role === "user") {
        filter.user = req.user._id;
      }
    }
    if (nestedField && nestedIdParam && req.params[nestedIdParam]) {
      filter[nestedField] = req.params[nestedIdParam];
    }

    const countDocments = await Model.countDocuments();
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .Filter()
      .search(isProduct ? "Product" : "")
      .sort()
      .field()
      .pagination(countDocments);

    const { MongooseQuery, paginationResults } = apiFeatures;

    if (cashConditions && caches.mediumTermCache_7Days.has(cacheKey)) {
      let products = caches.mediumTermCache_7Days.get(cacheKey);
      products = products.map((product) => {
        const language = (req.locale || req.language || "en").toLowerCase();
        const isArabic = language.startsWith("ar");
        const { title_ar, description_ar, ...rest } = product;

        return {
          ...rest,
          title: isArabic && title_ar ? title_ar : product.title,
          description:
            isArabic && description_ar ? description_ar : product.description,
        };
      });
      return res.status(200).json({
        status: req.t("http.success"),
        message: req.t("http.found", { field: req.t("model.document") }),
        isCached: true,
        results: products.length,
        paginationResults,
        data: products,
      });
    }

    const docments = await MongooseQuery.lean({ virtuals: true });

    let localizedDocuments = docments;
    if (isProduct) {

      const language = (req.locale || req.language || "en").toLowerCase();

      const isArabic = language.startsWith("ar");

      localizedDocuments = docments.map((docment) => {
        const { title_ar, description_ar, ...rest } = docment;

       
        return {
          ...rest,
          title: isArabic && title_ar ? title_ar : docment.title,
          description:
            isArabic && description_ar ? description_ar : docment.description,
        };
      });
    }

    if (cashConditions) {
      caches.mediumTermCache_7Days.set(cacheKey, docments);
    }

    res.status(200).json({
      status: req.t("http.success"),
      message: req.t("http.found", { field: req.t("model.document") }),
      results: docments.length,
      paginationResults,
      data: localizedDocuments,
    });
  });

exports.setParamIdToBody = (fieldName) => (req, res, next) => {
  const paramName = `${fieldName}Id`;

  if (req.params[paramName]) {
    if (!req.body[fieldName]) {
      req.body[fieldName] = req.params[paramName];
    }
  }
  if (req.user._id) {
    req.body.user = req.user._id;
  }

  next();
};

exports.createUserArrayHandler = (field, Model, operation, options = {}) =>
  asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    const { successMessage } = options;
    const userCashKey = generateCacheKey("user", _id);

    let user;
    let message;

    switch (operation) {
      case "add":
        const itemToAdd = options.getItemFromBody
          ? options.getItemFromBody(req.body)
          : req.body;
        user = await Model.findOneAndUpdate(
          { _id },
          { $addToSet: { [field]: itemToAdd } },
          { new: true }
        );
        message =
          successMessage ||
          req.t("http.added", { field }) ||
          `${field} added successfully`;
        break;

      case "remove":
        const itemId =
          req.params[options.paramKey || `${field.slice(0, -1)}Id`];
        const removeQuery = req.params.productId || { _id: itemId };

        user = await Model.findOneAndUpdate(
          { _id },
          { $pull: { [field]: removeQuery } },
          { new: true }
        );
        message =
          successMessage ||
          req.t("http.deleted", { field }) ||
          `${field} removed successfully`;
        break;

      case "update":
        const updateId = req.params[options.paramKey || "addressId"];
        user = await Model.findOneAndUpdate(
          { _id },
          { $set: { [`${field}.$[elem]`]: req.body } },
          { arrayFilters: [{ "elem._id": updateId }], new: true }
        );
        message =
          successMessage ||
          req.t("http.updated", { field }) ||
          `${field} updated successfully`;
        break;

      case "get":
        const populateField = options.populate;
        user = populateField
          ? await Model.findById(_id).populate(field)
          : await Model.findById(_id);
        message =
          successMessage ||
          req.t("http.found", { field }) ||
          `Get ${field} successfully`;
        break;

      case "removeAll":
        user = await Model.findOneAndUpdate(
          { _id },
          { $set: { [field]: [] } },
          { new: true }
        );
        message = successMessage || `All ${field} removed successfully`;
        break;

      default:
        return next(new ApiError("Invalid operation", 400));
    }

    if (!user) {
      return next(
        new ApiError(
          req.t("http.notFound", { field: req.t("model.user"), id: _id }),
          404
        )
      );
    }

    caches.longTermCache_30Days.set(userCashKey, {
      id: user._id,
      name: user.name,
      email: user.email,
      wishList: user.wishList,
      profileImage: user.profileImage,
      language: user.language,
    });

    const responseData = {
      status: req.t("http.success"),
      message,
      data: user[field],
    };

    // Add results count for get operations
    if (operation === "get") {
      responseData.results = user[field].length;
    }

    res.status(200).json(responseData);
  });
