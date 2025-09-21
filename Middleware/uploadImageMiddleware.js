/* eslint-disable import/no-extraneous-dependencies */
const path = require("path");

const multer = require("multer");
const asyncHandler = require("express-async-handler");
const sharp = require("sharp");

const ApiError = require("../utils/ApiError");

const multerConfig = () => {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else cb(new ApiError("Only Image are allwed! ", 400), false);
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });
  return upload;
};

exports.uploadSingleImage = (filedName) => multerConfig().single(filedName);

exports.uploadMultipleImage = (filedsArray) =>
  multerConfig().fields(filedsArray);

exports.MainOptimizeImage = (
  folderName,
  filedName = "image",
  width = 1200,
  height = 1200
) =>
  asyncHandler(async (req, res, next) => {
    const hasSingleFile = req.file && req.file.buffer;
    const hasProductFiles =
      folderName === "products" && req.files && req.files.imageCover;

    if (!hasSingleFile && !hasProductFiles) {
      return next();
    }

    const sharpBuffer = hasProductFiles
      ? req.files.imageCover[0].buffer
      : req.file.buffer;

    const uploadPath = path.join(__dirname, "..", "uploads", folderName);
    const filename = `${folderName}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const fullPath = path.join(uploadPath, filename);
    const baseUrl = `${req.protocol}://${req.get("host")}`;


    await sharp(sharpBuffer)
      .resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
        position: sharp.strategy.attention, 
        kernel: sharp.kernel.lanczos3, 
      })
      .normalize()
      //   .toFormat("webp")
      .webp({ quality: 90, effort: 6, nearLossless: true })
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: 'Copyright (c) 2025, "Hassan Omar"',
          },
        },
      })
      .toFile(fullPath);
    req.body[filedName] = `${baseUrl}/${folderName}/${filename}`;
    next();
  });
