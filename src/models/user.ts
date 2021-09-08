import mysql from 'mysql2/promise';

import mysqlConfig from '../mysql/config';
import { selectOne } from '../lib/mysqlConnectionPool';
import logger from '../../config/winston';

const pool = mysql.createPool(mysqlConfig);

export default class UserModels {
  public async emailDuplicateCheck(email: string): Promise<{ id: number } | undefined> {
    try {
      const emailDuplicateCheckSQL = `SELECT id FROM TB_USERS WHERE email = '${email}'`;
      const emailDuplicateCheckResult = await selectOne(emailDuplicateCheckSQL);

      return emailDuplicateCheckResult;
    } catch (err) {
      logger.error('UserModels duplicateEmailCheck()', err);
      throw err;
    }
  }

  public async existingUserCheck(email: string, nickname: string): Promise<{ id: number } | undefined> {
    try {
      const existingUserCheckSQL = `SELECT id FROM TB_USERS WHERE email = '${email}' OR nickname = '${nickname}'`;
      const existingUserCheckResult = await selectOne(existingUserCheckSQL);

      return existingUserCheckResult;
    } catch (err) {
      logger.error('UserModels existingUserCheck()', err);
      throw err;
    }
  }

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
      logger.error('UserModels signUp()', err);
      throw err;
    }
  }

  public async getMyInformation(userId: number): Promise<{
    id?: number,
    kartRiderAccessId?: string,
    email?: string,
    clubId?: number,
    nickname?: string,
    profileImageUri?: string,
    rating?: string,
    isWithdrawal?: number
  }> {
    try {
      const getUserInfoSQL = `
          SELECT
          id, kartRiderAccessId, email, clubId, nickname, profileImageUri, rating, isWithdrawal
          FROM TB_USERS
          WHERE id = ${userId}
        `;
      const userInfoResult = await selectOne(getUserInfoSQL);

      return userInfoResult;
    } catch (err) {
      logger.error('UserModels getMyInformation()', err);
      throw err;
    }
  }
}
