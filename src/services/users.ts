import express from 'express';
import nodemailer from 'nodemailer';
import request from 'request-promise-native';
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
    userInfoHttpStatusCode: number,
    userInfoData: UserType | string,
    userInfoMessage: string
  }> {
    try {
      if (req.user) {
        if (req.user.isWithdrawal === 1) {
          req.logout();
          req.session.destroy(null);

          return {
            userInfoHttpStatusCode: 200,
            userInfoData: 'no-user-info',
            userInfoMessage: '로그인이 되어있지 않습니다.',
          };
        }

        const myInformation = await this.usersModels.getMyInformation(req.user.id);

        return {
          userInfoHttpStatusCode: 200,
          userInfoData: myInformation,
          userInfoMessage: '내 정보를 성공적으로 불러왔습니다.',
        };
      }

      return {
        userInfoHttpStatusCode: 200,
        userInfoData: 'no-user-info',
        userInfoMessage: '로그인이 되어있지 않습니다.',
      };
    } catch (err) {
      logger.error('UsersService checkEmailDuplicateService()', err);
      throw err;
    }
  }

  public async findEmailService(accessId: string): Promise<{
    httpStatusCode: number,
    data: {
      email: string
    } | string,
    message: string
  }> {
    try {
      if (!accessId) {
        return {
          httpStatusCode: 403,
          data: 'blank-access-id',
          message: '카트라이더 accessId가 입력되지 않았습니다.',
        };
      }

      const findEmail = await this.usersModels.findEmail(accessId);
      if (!findEmail) {
        return {
          httpStatusCode: 403,
          data: 'no-user-info',
          message: '해당 닉네임으로 가입한 정보가 없습니다.',
        };
      }

      return {
        httpStatusCode: 200,
        data: findEmail,
        message: '이메일 찾기가 완료되었습니다.',
      };
    } catch (err) {
      logger.error('UsersService findEmailService()', err);
      throw err;
    }
  }

  public async findPasswordService(data: { email: string, accessId: string }): Promise<{
    httpStatusCode: number,
    data: string,
    message: string
  }> {
    try {
      const { email, accessId } = data;

      if (!email) {
        return {
          httpStatusCode: 403,
          data: 'blank-email-id',
          message: '이메일이 입력되지 않았습니다.',
        };
      }

      if (!accessId) {
        return {
          httpStatusCode: 403,
          data: 'blank-access-id',
          message: '카트라이더 accessId가 입력되지 않았습니다.',
        };
      }

      const findPassword = await this.usersModels.findPassword(data);
      if (findPassword === 'no-user-info') {
        return {
          httpStatusCode: 403,
          data: 'no-user-info',
          message: '입력한 이메일과 닉네임에 일치하는 회원님의 정보가 없습니다.',
        };
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: process.env.SMTP_HOST,
        tls: { minVersion: 'TLSv1' },
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: `"카트라이더 클럽 매니저" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: '[Kartrider club management] 비밀번호 변경',
        html: `새로 변경된 비밀번호는 아래와 같습니다.<br/>${findPassword}<br/><br/>내 정보 수정에 들어가서 새로 비밀번호를 바꿔주세요!`,
      });

      nodemailer.getTestMessageUrl(info);

      return {
        httpStatusCode: 200,
        data: 'find-password-success',
        message: '비밀번호 찾기가 완료되었습니다.',
      };
    } catch (err) {
      logger.error('UsersService findPasswordService()', err);
      throw err;
    }
  }

  public async loadUserNicknameService(accessId: string): Promise<{
    loadNicknameHttpStatusCode: number,
    loadNicknameData: any,
    loadNicknameMessage: string
  }> {
    try {
      if (!accessId) {
        return {
          loadNicknameHttpStatusCode: 403,
          loadNicknameData: 'blank-access-id',
          loadNicknameMessage: '카트라이더 accessId가 입력되지 않았습니다.',
        };
      }

      const requestOptions = {
        method: 'GET',
        json: true,
        uri: `https://api.nexon.co.kr/kart/v1.0/users/${encodeURI(accessId)}`,
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
            loadNicknameHttpStatusCode: 200,
            loadNicknameData: 'no-nickname',
            loadNicknameMessage: '현재 카트라이더 닉네임에 존재하지 않는 유저입니다.',
          };
        }

        return {
          loadNicknameHttpStatusCode: err.statusCode,
          loadNicknameData: 'server-error',
          loadNicknameMessage: '서버에 오류가 발생하였습니다.',
        };
      }

      return {
        loadNicknameHttpStatusCode: 200,
        loadNicknameData: getKartRiderUserInfo,
        loadNicknameMessage: '유저정보를 성공적으로 불러왔습니다.',
      };
    } catch (err) {
      logger.error('UsersService loadUserNicknameService()', err);
      throw err;
    }
  }
}
