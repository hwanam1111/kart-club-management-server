import awsSDK from 'aws-sdk';

const s3CopyObject = async (fileKey: string, fileName: string, newDirectory: string) => {
  const s3Copy = new awsSDK.S3();

  const copyParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    CopySource: encodeURI(`${process.env.AWS_S3_BUCKET}/${fileKey}`),
    Key: `${newDirectory}/${fileName}`,
  };

  await s3Copy.copyObject(copyParams).promise();
};

export default s3CopyObject;
