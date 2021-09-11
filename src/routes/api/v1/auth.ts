import 'reflect-metadata';
import express from 'express';
import passport from 'passport';
import { Container } from 'typedi';

import logger from '../../../../config/winston';
import isLoggedIn from '../../middlewares/isLoggedIn';
import isNotLoggedIn from '../../middlewares/isNotLoggedIn';
import AuthService from '../../../services/auth';

const router = express.Router();

router.post('/sign-up', isNotLoggedIn, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authServiceInstance = Container.get(AuthService);
    const { httpStatusCode, data, message } = await authServiceInstance.signUpService(req.body);

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    logger.error(`[${req.method}] '${req.originalUrl}'`, err);
    return next(err);
  }
});

router.post('/login', isNotLoggedIn, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        logger.error(`[${req.method}] '${req.originalUrl}' - Auth error`, err);
        return next(err);
      }

      const userAgent = req.headers['user-agent'];
      const { email } = req.body;

      const authServiceInstance = Container.get(AuthService);
      if (info) {
        await authServiceInstance.loginLogService({
          email,
          userAgent,
          loginResult: false,
          failureReason: info.reason,
          classification: 'menual',
        });

        return res.status(401).json({
          data: 'login-failure',
          message: info.reason,
        });
      }

      return req.login(user, async (loginError) => {
        if (loginError) {
          logger.error(`[${req.method}] '${req.originalUrl}' - Passport login error`, loginError);
          return next(loginError);
        }

        await authServiceInstance.loginLogService({
          email,
          userAgent,
          loginResult: true,
          failureReason: '',
          classification: 'menual',
        });

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

router.post('/logout', isLoggedIn, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.logout();
    req.session.destroy(null);

    return res.status(200).json({
      data: 'logout-success',
      message: '로그아웃이 완료되었습니다.',
    });
  } catch (err) {
    logger.error(`[${req.method}] '${req.originalUrl}'`, err);
    return next(err);
  }
});

export default router;
