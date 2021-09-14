import 'reflect-metadata';
import express from 'express';
import { Container } from 'typedi';

import logger from '../../../../config/winston';
import isNotLoggedIn from '../../middlewares/isNotLoggedIn';
import UsersService from '../../../services/users';
import { UserType } from '../../../types/usersType';

const router = express.Router();

router.get('/email/duplicate/:email', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const usersServiceInstance = Container.get(UsersService);
    const { httpStatusCode, data, message } = await usersServiceInstance.checkEmailDuplicateService(req.params.email);

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    logger.error(`[${req.method}] '${req.originalUrl}'`, err);
    return next(err);
  }
});

router.get('/my', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const usersServiceInstance = Container.get(UsersService);
    const { userInfoHttpStatusCode, userInfoData, userInfoMessage } = await usersServiceInstance.getMyInformationService(req);

    if (userInfoHttpStatusCode !== 200 || userInfoData === 'no-user-info') {
      return res.status(userInfoHttpStatusCode).json({
        data: userInfoData,
        message: userInfoMessage,
      });
    }

    const { kartRiderAccessId } = userInfoData as UserType;
    const {
      loadNicknameHttpStatusCode,
      loadNicknameData,
      loadNicknameMessage,
    } = await usersServiceInstance.loadUserNicknameService(kartRiderAccessId);

    if (loadNicknameHttpStatusCode !== 200) {
      return res.status(loadNicknameHttpStatusCode).json({
        data: loadNicknameData,
        message: loadNicknameMessage,
      });
    }

    return res.status(200).json({
      data: {
        ...userInfoData as UserType,
        currentNickname: loadNicknameData.name,
      },
      message: '내 정보를 불러왔습니다.',
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/find/email', isNotLoggedIn, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const usersServiceInstance = Container.get(UsersService);
    const { httpStatusCode, data, message } = await usersServiceInstance.findEmailService(req.query.accessId as string);

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/find/password', isNotLoggedIn, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const usersServiceInstance = Container.get(UsersService);
    const { httpStatusCode, data, message } = await usersServiceInstance.findPasswordService(req.query as any);

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
