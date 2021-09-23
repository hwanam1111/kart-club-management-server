import awsSDK from 'aws-sdk';

const s3RemoveObject = async (fileKey: string) => {
  const s3Remove = new awsSDK.S3();

  const removeParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
  };
  await s3Remove.deleteObject(removeParams).promise();
};

export default s3RemoveObject;
