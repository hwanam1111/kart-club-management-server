import express from 'express';

import userRouter from './v1/user';

const app = express();

app.use('/v1/user', userRouter);

export default app;
