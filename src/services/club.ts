import { Service } from 'typedi';

import logger from '../../config/winston';
import s3CopyObject from '../utils/awsS3CopyObject';
import s3RemoveObject from '../utils/awsS3RemoveObject';

@Service()
export default class ClubService {
  constructor() {}

  public async verifyMasterImageService(file: any): Promise<{httpStatusCode: number, data: { imageUrl: string }, message: string}> {
    try {
      const moveDirectoryLocation = `uploads/${process.env.CURRENT_SERVER}/club/master_verify_images`;

      const fileKey = file.key;
      const fileName = fileKey.split('/').reverse()[0];

      await s3CopyObject(fileKey, fileName, moveDirectoryLocation);
      await s3RemoveObject(fileKey);

      return {
        httpStatusCode: 200,
        data: {
          imageUrl: `${process.env.AWS_S3_URL}/${moveDirectoryLocation}/${fileName}`,
        },
        message: '이미지 업로드를 완료하였습니다.',
      };
    } catch (err) {
      logger.error('ClubService verifyMasterImageService()', err);
      throw err;
    }
  }
}
