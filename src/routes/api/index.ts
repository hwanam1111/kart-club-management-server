import express from 'express';

import authRouter from './v1/auth';
import userRouter from './v1/user';

const app = express();

app.use('/v1/auth', authRouter);
app.use('/v1/users', userRouter);

export default app;
