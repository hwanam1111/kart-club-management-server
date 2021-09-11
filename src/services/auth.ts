import { Service } from 'typedi';
import bcrypt from 'bcryptjs';

import logger from '../../config/winston';
import AuthModels from '../models/auth';
import UsersModels from '../models/users';

@Service()
export default class AuthService {
  constructor(
    private authModels = new AuthModels(),
    private usersModels = new UsersModels(),
  ) { }

  public async signUpService(data: {
    email: string,
    password: string,
    nickname: string,
    accessId: string
  }): Promise<{ httpStatusCode: number, data: string, message: string }> {
    try {
      const { email, password, nickname, accessId } = data;
      const emailRegExp = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;
      const passwordRegExp = /^(?=.*[a-zA-z])(?=.*[0-9])(?!.*[^a-zA-z0-9$`~!@$!%*#^?&\\(\\)\-_=+]).{8,16}$/;
      const nicknameRegExp = /[!?@#$%^&*():;+-=~{}<>\_\[\]\|\\\"\'\,\.\/\`\₩ ]/g;

      if (email === '') {
        return {
          httpStatusCode: 403,
          data: 'blank-email',
          message: '이메일이 입력되지 않았습니다.',
        };
      }

      if (!emailRegExp.test(email)) {
        return {
          httpStatusCode: 403,
          data: 'unformatted-email',
          message: '이메일 형식이 맞지 않습니다.',
        };
      }

      if (password === '') {
        return {
          httpStatusCode: 403,
          data: 'blank-password',
          message: '비밀번호가 입력되지 않았습니다.',
        };
      }

      if (!passwordRegExp.test(password)) {
        return {
          httpStatusCode: 403,
          data: 'unformatted-password',
          message: '비밀번호 형식이 맞지 않습니다.',
        };
      }

      if (nickname === '') {
        return {
          httpStatusCode: 403,
          data: 'blank-nickname',
          message: '닉네임이 입력되지 않았습니다.',
        };
      }

      if (nicknameRegExp.test(nickname)) {
        return {
          httpStatusCode: 403,
          data: 'unformatted-nickname',
          message: '닉네임 형식이 맞지 않습니다.',
        };
      }

      if (!accessId) {
        return {
          httpStatusCode: 403,
          data: 'unverify-nickname',
          message: '닉네임이 검증되지 않았습니다.',
        };
      }

      const existingUser = await this.usersModels.existingUserCheck(email, nickname);
      if (existingUser) {
        return {
          httpStatusCode: 403,
          data: 'existing-user',
          message: '이미 존재하는 회원입니다.',
        };
      }

      const hashedPassword = bcrypt.hashSync(password, 11);
      await this.authModels.signUp({ email, nickname, accessId, hashedPassword });

      return {
        httpStatusCode: 201,
        data: 'sign-up-success',
        message: '회원가입이 완료되었습니다.',
      };
    } catch (err) {
      logger.error('AuthService signUpService()', err);
      throw err;
    }
  }

  public async loginLogService(data: {
    email: string,
    userAgent: string,
    loginResult: boolean,
    failureReason: string,
    classification: string
  }): Promise<void> {
    try {
      await this.authModels.loginLog(data);
    } catch (err) {
      logger.error('AuthService loginLogService()', err);
      throw err;
    }
  }
}
