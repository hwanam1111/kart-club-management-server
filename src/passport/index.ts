import passport from 'passport';
import local from './local';
import logger from '../../config/winston';
import { selectOne } from '../lib/mysqlConnectionPool';

export default function passportConfig() {
  passport.serializeUser((user: {
    id: number,
    email: string,
    password: string,
    isWithdrawal: number
  }, done: any) => {
    done(null, { id: user.id });
  });

  passport.deserializeUser(async (login: { id: number }, done: any) => {
    try {
      const getUserInfoSQL = `
        SELECT
        id, kartRiderAccessId, email, clubId, nickname, profileImageUri, rating, isWithdrawal
        FROM TB_USERS
        WHERE id = ${login.id}
      `;
      const userInfoResult = await selectOne(getUserInfoSQL);

      done(null, userInfoResult);
    } catch (error) {
      logger.error('Passport deserializeUser error: ', error);
      done(error);
    }
  });

  local();
}
