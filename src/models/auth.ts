import mysql from 'mysql2/promise';

import mysqlConfig from '../mysql/config';
import logger from '../../config/winston';

const pool = mysql.createPool(mysqlConfig);

export default class AuthModels {
  public async signUp(data: {email: string, hashedPassword: string, nickname: string, accessId: string }): Promise<void> {
    try {
      const { email, hashedPassword, nickname, accessId } = data;
      const addUserSQL = `INSERT INTO TB_USERS (
        kartRiderAccessId, email, password, nickname, createdAt
      ) VALUES (
        '${accessId}', '${email}', '${hashedPassword}', '${nickname}', NOW()
      )`;

      await pool.execute(addUserSQL);
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
        '${email}', (SELECT SUBSTRING_INDEX(USER(), '@', -1)), '${userAgent}', ${loginResult}, '${failureReason}', '${classification}', NOW()
      )`;

      await pool.execute(addLoginFailureLogSQL);
    } catch (err) {
      logger.error('AuthModels loginLog()', err);
      throw err;
    }
  }
}
