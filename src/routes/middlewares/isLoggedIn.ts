import express from 'express';

const isLoggedin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    data: 'is-logged-in',
    message: '로그인이 되어있어야 합니다.',
  });
};

export default isLoggedin;
