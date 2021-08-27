import express from 'express';
import mysql from 'mysql2/promise';
import mysqlConfig from '../../mysql/config';

const pool = mysql.createPool(mysqlConfig);

const router = express.Router();

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
    //     profileImageUri: 'profile image',
    //     clubId: 1,
    //   },
    //   message: '내 정보를 성공적으로 불러왔습니다.',
    // });
  } catch (err) {
    return next(err);
  }
});

export default router;
