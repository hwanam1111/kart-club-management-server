import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import request from 'request-promise-native';

import mysqlConfig from '../../mysql/config';
import { selectOne } from '../../lib/mysqlConnectionPool';

const pool = mysql.createPool(mysqlConfig);

const router = express.Router();

router.get('/duplicate-check/email/:email', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { email } = req.params;
    const emailRegExp = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;

    if (email === '') {
      return res.status(403).json({
        error: 'not-enterd-email',
        message: '이메일이 입력되지 않았습니다.',
      });
    }

    if (!emailRegExp.test(email)) {
      return res.status(403).json({
        error: 'not-email-format',
        message: '이메일 형식이 아닙니다.',
      });
    }

    const emailDuplicateCheckSQL = `SELECT id FROM TB_USERS WHERE email = '${email}'`;
    const emailDuplicateCheckResult = await selectOne(emailDuplicateCheckSQL);

    if (emailDuplicateCheckResult) {
      return res.status(200).json({
        data: 'duplicate-email',
        message: '이미 사용중인 이메일입니다.',
      });
    }

    return res.status(200).json({
      data: 'available-email',
      message: '사용 가능한 이메일입니다.',
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/verify/nickname/:nickname', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { nickname } = req.params;

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
        return res.status(200).json({
          data: 'no-nickname',
          message: '현재 카트라이더 닉네임에 존재하지 않는 닉네임입니다.',
        });
      }

      return res.status(err.statusCode).json({
        data: 'server-error',
        message: '서버에 오류가 발생하였습니다.',
      });
    }

    return res.status(200).json({
      data: getKartRiderUserInfo,
      message: '',
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/sign-up', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const { email, password, nickname, accessId } = req.body;
    const emailRegExp = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;
    const passwordRegExp = /^(?=.*[a-zA-z])(?=.*[0-9])(?!.*[^a-zA-z0-9$`~!@$!%*#^?&\\(\\)\-_=+]).{8,16}$/;
    const nicknameRegExp = /[!?@#$%^&*():;+-=~{}<>\_\[\]\|\\\"\'\,\.\/\`\₩ ]/g;

    if (email === '') {
      return res.status(403).json({
        data: 'blank-email',
        message: '이메일이 입력되지 않았습니다.',
      });
    }

    if (!emailRegExp.test(email)) {
      return res.status(403).json({
        data: 'unformatted-email',
        message: '이메일 형식이 맞지 않습니다.',
      });
    }

    if (password === '') {
      return res.status(403).json({
        data: 'blank-password',
        message: '비밀번호가 입력되지 않았습니다.',
      });
    }

    if (!passwordRegExp.test(password)) {
      return res.status(403).json({
        data: 'unformatted-password',
        message: '비밀번호 형식이 맞지 않습니다.',
      });
    }

    if (nickname === '') {
      return res.status(403).json({
        data: 'blank-nickname',
        message: '닉네임이 입력되지 않았습니다.',
      });
    }

    if (nicknameRegExp.test(nickname)) {
      return res.status(403).json({
        data: 'unformatted-nickname',
        message: '닉네임 형식이 맞지 않습니다.',
      });
    }

    if (!accessId) {
      return res.status(403).json({
        data: 'unverify-nickname',
        message: '닉네임이 검증되지 않았습니다.',
      });
    }

    const existingUserCheckSQL = `SELECT id FROM TB_USERS WHERE email = '${email}' OR nickname = '${nickname}'`;
    const existingUserCheckResult = await selectOne(existingUserCheckSQL);
    if (existingUserCheckResult) {
      return res.status(403).json({
        data: 'existing-user',
        message: '이미 존재하는 회원입니다.',
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 11);
    const addUserSQL = `INSERT INTO TB_USERS (
      KartRiderAccessId, email, password, nickname, createdAt
    ) VALUES (
      '${accessId}', '${email}', '${hashedPassword}', '${nickname}', NOW()
    )`;
    await pool.execute(addUserSQL);

    return res.status(201).json({
      data: 'sign-up-success',
      message: '회원가입이 완료되었습니다.',
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/login', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      const userIp = req.connection.remoteAddress.replace('::ffff:', '');
      const userAgent = req.headers['user-agent'];
      const { email } = req.body;

      if (err) {
        console.error('Authenticate error: ', err);
        return next(err);
      }

      if (info) {
        const addLoginFailureLogSQL = `INSERT INTO TB_USERS_LOGIN_LOGS (
          enterdEmail, userIp, userAgent, loginResult, failureReason, classification, createdAt
        ) VALUES (
          '${email}', '${userIp}', '${userAgent}', false, '${info.reason}', 'menual', NOW()
        )`;
        pool.execute(addLoginFailureLogSQL);

        return res.status(401).json({
          data: 'login-failure',
          message: '이메일이나 비밀번호가 잘못 입력되었습니다.',
        });
      }

      return req.login(user, async (loginError) => {
        if (loginError) {
          console.error('Passport login error.', loginError);
          return next(loginError);
        }

        const addLoginFailureLogSQL = `INSERT INTO TB_USERS_LOGIN_LOGS (
          enterdEmail, userIp, userAgent, loginResult, classification, createdAt
        ) VALUES (
          '${user.email}', '${userIp}', '${userAgent}', true, 'menual', NOW()
        )`;
        pool.execute(addLoginFailureLogSQL);

        return res.status(201).json({
          data: 'login-success',
          message: '로그인이 완료되었습니다.',
        });
      });
    })(req, res, next);

    return null;
  } catch (err) {
    return next(err);
  }
});

router.get('/my', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    if (req.user) {
      if (req.user.isWithdrawal === 1) {
        req.logout();
        req.session.destroy(null);

        return res.status(200).json({
          data: 'no-user-info',
          message: '로그인이 되어있지 않습니다.',
        });
      }

      const getUserInfoSQL = `
        SELECT
        id, kartRiderAccessId, email, clubId, nickname, profileImageUri, rating, isWithdrawal
        FROM TB_USERS
        WHERE id = ${req.user.id}
      `;
      const userInfoResult = await selectOne(getUserInfoSQL);

      return res.status(200).json({
        data: userInfoResult,
        message: '내 정보를 성공적으로 불러왔습니다.',
      });
    }

    return res.status(200).json({
      data: 'no-user-info',
      message: '로그인이 되어있지 않습니다.',
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
