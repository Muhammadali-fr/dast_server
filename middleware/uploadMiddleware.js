const multer = require("multer");
const { s3, PutObjectCommand } = require("../config/s3"); // S3 configni import qilamiz
const crypto = require("crypto");

const storage = multer.memoryStorage(); // RAMda saqlaymiz
const upload = multer({ storage });

const uploadToS3 = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "Fayl topilmadi" });
  }

  const file = req.file;
  const fileKey = `avatars/${crypto.randomBytes(10).toString("hex")}-${
    file.originalname
  }`;

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  try {
    await s3.send(new PutObjectCommand(params));

    req.fileUrl = `https://${process.env.BUCKET_NAME}.s3.nyc3.amazonaws.com/${fileKey}`;
    next();
  } catch (error) {
    console.error("S3 ga yuklashda xatolik:", error);
    return res.status(500).json({ message: "Fayl yuklashda xatolik", error });
  }
};

module.exports = { upload, uploadToS3 };
