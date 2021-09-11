import express from 'express';

import authRouter from './v1/auth';
import usersRouter from './v1/users';

const app = express();

app.use('/v1/auth', authRouter);
app.use('/v1/users', usersRouter);

export default app;
