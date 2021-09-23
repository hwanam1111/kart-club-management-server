import multer from 'multer';
import multerS3 from 'multer-s3';
import awsSDK from 'aws-sdk';

awsSDK.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_S3_REGION,
});

const imageUpload = multer({
  storage: multerS3({
    s3: new awsSDK.S3(),
    bucket: process.env.AWS_S3_BUCKET,
    key(req, file, cb) {
      const uploadDirectory = 'uploads';
      const originalName = file.originalname;

      cb(null, `${uploadDirectory}/${new Date().getTime()}_${originalName}`);
    },
  }),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

export default imageUpload;
