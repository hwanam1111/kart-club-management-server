import express from 'express';

const isNotLoggedin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    data: 'is-not-logged-in',
    message: '로그인이 되어있지 않아야 합니다.',
  });
};

export default isNotLoggedin;
