import mysql from 'mysql2/promise';

import mysqlConfig from '../mysql/config';
import logger from '../../config/winston';

const pool = mysql.createPool(mysqlConfig);

export default class AuthModels {
  public async signUp(data: {email: string, hashedPassword: string, accessId: string }): Promise<void> {
    try {
      const { email, hashedPassword, accessId } = data;
      const addUserSQL = `INSERT INTO TB_USERS (
        kartRiderAccessId, email, password, createdAt
      ) VALUES (
        ?, ?, ?, NOW()
      )`;

      await pool.execute(addUserSQL, [accessId, email, hashedPassword]);
    } catch (err) {
      logger.error('AuthModels signUp()', err);
      throw err;
    }
  }

  public async loginLog(data: {
    email: string,
    userAgent: string,
    loginResult: boolean,
    failureReason: string,
    classification: string
  }): Promise<void> {
    try {
      const { email, userAgent, loginResult, failureReason, classification } = data;
      const addLoginFailureLogSQL = `INSERT INTO TB_USERS_LOGIN_LOGS (
        enterdEmail, userIp, userAgent, loginResult, failureReason, classification, createdAt
      ) VALUES (
        ?, (SELECT SUBSTRING_INDEX(USER(), '@', -1)), ?, ?, ?, ?, NOW()
      )`;

      await pool.execute(addLoginFailureLogSQL, [email, userAgent, loginResult, failureReason, classification]);
    } catch (err) {
      logger.error('AuthModels loginLog()', err);
      throw err;
    }
  }
}
