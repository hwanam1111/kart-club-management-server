import 'reflect-metadata';
import express from 'express';
import { Container } from 'typedi';

import logger from '../../../../config/winston';
import isLoggedIn from '../../middlewares/isLoggedIn';
import imageUpload from '../../middlewares/imageUpload';
import ClubService from '../../../services/club';
import { MulterFile } from '../../../types/multerTypes';

const router = express.Router();

router.post('/verify/master/image', isLoggedIn, imageUpload.single('image'),
  async (req: express.Request & { file: MulterFile }, res: express.Response, next: express.NextFunction) => {
    try {
      if (req.file) {
        const clubServiceInstance = Container.get(ClubService);
        const { httpStatusCode, data, message } = await clubServiceInstance.verifyMasterImageService(req.file as any);

        return res.status(httpStatusCode).json({
          data, message,
        });
      }

      return res.status(403).json({
        data: 'no-image-file',
        message: '이미지 파일이 존재하지 않습니다.',
      });
    } catch (err) {
      logger.error(`[${req.method}] '${req.originalUrl}'`, err);
      return next(err);
    }
  });

router.post('/register', isLoggedIn, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const clubServiceInstance = Container.get(ClubService);
    const { httpStatusCode, data, message } = await clubServiceInstance.clubRegisterService({
      userId: req.user.id,
      kartRiderAccessId: req.user.kartRiderAccessId,
      ...req.body,
    });

    return res.status(httpStatusCode).json({
      data, message,
    });
  } catch (err) {
    logger.error(`[${req.method}] '${req.originalUrl}'`, err);
    return next(err);
  }
});

export default router;
