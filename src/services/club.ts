import { Service } from 'typedi';

import logger from '../../config/winston';
import s3CopyObject from '../utils/awsS3CopyObject';
import s3RemoveObject from '../utils/awsS3RemoveObject';
import ClubModels from '../models/club';

@Service()
export default class ClubService {
  constructor(
    private clubModels = new ClubModels(),
  ) {}

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

  public async clubRegisterService(data: {
    userId: number,
    kartRiderAccessId: string,
    clubName: string,
    verifyMasterImageUrl: string
  }): Promise<{httpStatusCode: number, data: string, message: string}> {
    try {
      const { clubName, verifyMasterImageUrl } = data;

      if (!clubName) {
        return {
          httpStatusCode: 403,
          data: 'blank-club-name',
          message: '클럽 명이 입력되지 않았습니다.',
        };
      }

      if (!verifyMasterImageUrl) {
        return {
          httpStatusCode: 403,
          data: 'blank-verify-master-image-url',
          message: '클럽 마스터 검증을 위한 이미지 url이 존재하지 않습니다.',
        };
      }

      const clubRegisterResult = await this.clubModels.clubRegister(data);

      if (clubRegisterResult === 'already-application') {
        return {
          httpStatusCode: 403,
          data: 'already-application',
          message: '이미 클럽 등록 신청을 하였습니다.',
        };
      }

      if (clubRegisterResult === 'already-registered-club-name') {
        return {
          httpStatusCode: 403,
          data: 'already-registered-club-name',
          message: '이미 등록이 완료되었거나, 등록 신청중인 클럽 명입니다.',
        };
      }

      return {
        httpStatusCode: 201,
        data: 'club-registerd-success',
        message: '클럽 등록 신청이 완료되었습니다.',
      };
    } catch (err) {
      logger.error('ClubService clubRegisterService()', err);
      throw err;
    }
  }
}
