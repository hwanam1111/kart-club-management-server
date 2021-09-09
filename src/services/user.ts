import express from 'express';
import { Service } from 'typedi';
import request from 'request-promise-native';

import logger from '../../config/winston';
import UserModels from '../models/user';

@Service()
export default class UserService {
  constructor(private userModels = new UserModels()) {}

  public async checkEmailDuplicateService(email: string): Promise<{httpStatusCode: number, data: string, message: string}> {
    try {
      const emailRegExp = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;

      if (!emailRegExp.test(email)) {
        return {
          httpStatusCode: 403,
          data: 'not-email-format',
          message: '이메일 형식이 아닙니다.',
        };
      }

      const emailDuplicate = await this.userModels.emailDuplicateCheck(email);
      if (emailDuplicate) {
        return {
          httpStatusCode: 200,
          data: 'duplicate-email',
          message: '이미 사용중인 이메일입니다.',
        };
      }

      return {
        httpStatusCode: 200,
        data: 'available-email',
        message: '사용 가능한 이메일입니다.',
      };
    } catch (err) {
      logger.error('UserService checkEmailDuplicateService()', err);
      throw err;
    }
  }

  public async verifyNicknameService(nickname: string): Promise<{httpStatusCode: number, data: any, message: string}> {
    try {
      const requestOptions = {
        method: 'GET',
        json: true,
        uri: `https://api.nexon.co.kr/kart/v1.0/users/nickname/${encodeURI(nickname)}`,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: process.env.NEXON_DEVELOPERS_API_KEY,
        },
      };

      let getKartRiderUserInfo: () => any;
      try {
        getKartRiderUserInfo = await request(requestOptions, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            return body;
          }

          return error;
        });
      } catch (err) {
        if (err.statusCode === 404) {
          return {
            httpStatusCode: 200,
            data: 'no-nickname',
            message: '현재 카트라이더 닉네임에 존재하지 않는 닉네임입니다.',
          };
        }

        return {
          httpStatusCode: err.statusCode,
          data: 'server-error',
          message: '서버에 오류가 발생하였습니다.',
        };
      }

      return {
        httpStatusCode: 200,
        data: getKartRiderUserInfo,
        message: '닉네임 검증이 완료되었습니다.',
      };
    } catch (err) {
      logger.error('UserService verifyNickname()', err);
      throw err;
    }
  }

  public async getMyInformationService(req: express.Request): Promise<{
    httpStatusCode: number,
    data: {
      id?: number,
      kartRiderAccessId?: string,
      email?: string,
      clubId?: number,
      nickname?: string,
      profileImageUri?: string,
      rating?: string,
      isWithdrawal?: number
    } | string,
    message: string
  }> {
    try {
      if (req.user) {
        if (req.user.isWithdrawal === 1) {
          req.logout();
          req.session.destroy(null);

          return {
            httpStatusCode: 200,
            data: 'no-user-info',
            message: '로그인이 되어있지 않습니다.',
          };
        }

        const myInformation = await this.userModels.getMyInformation(req.user.id);

        return {
          httpStatusCode: 200,
          data: myInformation,
          message: '내 정보를 성공적으로 불러왔습니다.',
        };
      }

      return {
        httpStatusCode: 200,
        data: 'no-user-info',
        message: '로그인이 되어있지 않습니다.',
      };
    } catch (err) {
      logger.error('UserService checkEmailDuplicateService()', err);
      throw err;
    }
  }
}
