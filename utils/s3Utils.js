const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/awsConfig");

const uploadFileToS3 = async (fileBuffer, fileName, bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: `avatars/${fileName}`,
    Body: fileBuffer,
    ACL: "public-read", // Rasmni ochiq qilish
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${bucketName}.s3.amazonaws.com/avatars/${fileName}`;
  } catch (error) {
    console.error("Fayl yuklashda xatolik:", error);
    throw error;
  }
};

const deleteFileFromS3 = async (fileName, bucketName) => {
  const params = {
    Bucket: bucketName,
    Key: `avatars/${fileName}`,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    console.log("Fayl o‘chirildi:", fileName);
  } catch (error) {
    console.error("Fayl o‘chirishda xatolik:", error);
    throw error;
  }
};

module.exports = { uploadFileToS3, deleteFileFromS3 };
