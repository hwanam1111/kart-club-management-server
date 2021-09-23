import express from 'express';

import authRouter from './v1/auth';
import usersRouter from './v1/users';
import clubRouter from './v1/club';

const app = express();

app.use('/v1/auth', authRouter);
app.use('/v1/users', usersRouter);
app.use('/v1/club', clubRouter);

export default app;
