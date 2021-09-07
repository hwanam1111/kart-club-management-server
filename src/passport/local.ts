import passport from 'passport';
import passportLocal from 'passport-local';
import bcrypt from 'bcryptjs';

import { selectOne } from '../routes/lib/mysqlConnectionPool';

const LocalStrategy = passportLocal.Strategy;

export default function local() {
  passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
  }, async (email: string, password: string, done: any) => {
    try {
      const getUserInfoSQL = `SELECT id, email, password, isWithdrawal FROM TB_USERS WHERE email = '${email}'`;
      const userInfoResult = await selectOne(getUserInfoSQL);

      if (!userInfoResult) {
        return done(null, false, { reason: '존재하지 않는 이메일입니다.' });
      }

      if (userInfoResult.isWithdrawal === 1) {
        return done(null, false, { reason: '탈퇴한 회원입니다.' });
      }

      const passwordEqualResult = await bcrypt.compare(password, userInfoResult.password);
      if (!passwordEqualResult) {
        return done(null, false, { reason: '비밀번호가 틀렸습니다.' });
      }

      return done(null, userInfoResult);
    } catch (error) {
      return done(error);
    }
  }));
}
