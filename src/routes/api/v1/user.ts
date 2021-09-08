import 'reflect-metadata';
import express from 'express';
import { Container } from 'typedi';

import logger from '../../../../config/winston';

import UserService from '../../../services/user';

const router = express.Router();

router.get('/email/duplicate/:email', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userServiceInstance = Container.get(UserService);
    const { httpStatusCode, data, message } = await userServiceInstance.checkEmailDuplicateService(req.params.email);

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    logger.error(`[${req.method}] '${req.originalUrl}'`, err);
    return next(err);
  }
});

router.get('/verify/nickname/:nickname', async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const userServiceInstance = Container.get(UserService);
    const { httpStatusCode, data, message } = await userServiceInstance.verifyNicknameService(req.params.nickname);

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
    const userServiceInstance = Container.get(UserService);
    const { httpStatusCode, data, message } = await userServiceInstance.getMyInformationService(req);

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
