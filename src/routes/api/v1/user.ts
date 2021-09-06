import express from 'express';
import mysql from 'mysql2/promise';

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

router.get('/my', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    return res.status(200).json({
      data: 'no-user-info',
      message: '로그인이 되어있지 않습니다.',
    });

    // return res.status(200).json({
    //   data: {
    //     id: 1,
    //     email: 'email',
    //     nickname: 'nickname',
    //     rating: 'rating',
    //     profileImageUri: 'https://avatars.githubusercontent.com/u/23207057?v=4',
    //     clubId: 1,
    //   },
    //   message: '내 정보를 성공적으로 불러왔습니다.',
    // });
  } catch (err) {
    return next(err);
  }
});

export default router;
