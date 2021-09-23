import awsSDK from 'aws-sdk';

const s3GetObject = async (fileKey: string) => {
  const s3 = new awsSDK.S3();
  const getParams = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileKey,
  };

  let response;
  try {
    response = await s3.getObject(getParams).promise();
  } catch (err) {
    response = null;
  }

  return response;
};

export default s3GetObject;
