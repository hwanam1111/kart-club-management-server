import express from 'express';
import { Service } from 'typedi';
import { UserType } from '../types/usersType';

import logger from '../../config/winston';
import UsersModels from '../models/users';

@Service()
export default class UsersService {
  constructor(private usersModels = new UsersModels()) {}

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

      const emailDuplicate = await this.usersModels.emailDuplicateCheck(email);
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
      logger.error('UsersService checkEmailDuplicateService()', err);
      throw err;
    }
  }

  public async getMyInformationService(req: express.Request): Promise<{
    httpStatusCode: number,
    data: UserType | string,
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

        const myInformation = await this.usersModels.getMyInformation(req.user.id);

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
      logger.error('UsersService checkEmailDuplicateService()', err);
      throw err;
    }
  }
}
