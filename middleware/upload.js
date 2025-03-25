require("dotenv").config();
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require("mongoose");

// MongoDB ulanishini tekshiramiz
const mongoURI = process.env.DB;
if (!mongoURI) {
  throw new Error("MONGO_URI is not defined in .env file");
}

const connection = mongoose.createConnection(mongoURI);

// GridFS Storage sozlash
const storage = new GridFsStorage({
  db: connection,
  file: (req, file) => {
    return {
      bucketName: "uploads",
      filename: `${Date.now()}-${file.originalname}`,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
