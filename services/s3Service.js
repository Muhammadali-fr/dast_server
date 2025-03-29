const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const s3 = new S3Client({
  region: "nyc3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: `avatars/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  };

  await s3.send(new PutObjectCommand(params));

  return `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${params.Key}`;
};

module.exports = { uploadToS3 };
