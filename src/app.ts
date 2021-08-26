import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import path from 'path';
import session from 'express-session';
import hpp from 'hpp';
import helmet from 'helmet';
import redis from 'redis';
import connectRedis from 'connect-redis';

dotenv.config();

const RedisStore = connectRedis(session);
const { COOKIE_SECRET, NODE_ENV, REDIS_HOST, REDIS_DB, REDIS_PORT, SERVER_POST } = process.env;
const app = express();

app.use(morgan('dev'));
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

if (NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use(morgan('combined'));
  app.use(hpp());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: [
        'https://kart-club-management.com',
        'http://www.kart-club-management.com',
      ],
      credentials: true,
    }),
  );
} else {
  app.use(morgan('dev'));
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
}

app.use('/', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: COOKIE_SECRET,
    proxy: NODE_ENV === 'production',
    cookie: {
      maxAge: 3600000 * 24 * 365,
      httpOnly: true,
      secure: NODE_ENV === 'production',
      domain: NODE_ENV === 'production' ? '.kart-club-management.com' : undefined,
    },
    store: new RedisStore({
      client: redis.createClient({
        host: REDIS_HOST,
        port: parseInt(REDIS_PORT, 10),
        db: parseInt(REDIS_DB, 10),
      }),
      host: REDIS_HOST,
      port: parseInt(REDIS_PORT, 10),
      db: parseInt(REDIS_DB, 10),
      logErrors: true,
    }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());

http.createServer(app).listen(SERVER_POST);
