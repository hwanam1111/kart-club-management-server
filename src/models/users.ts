import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

import mysqlConfig from '../mysql/config';
import { selectOne } from '../lib/mysqlConnectionPool';
import logger from '../../config/winston';
import { UserType } from '../types/usersType';

const pool = mysql.createPool(mysqlConfig);

export default class UsersModels {
  public async emailDuplicateCheck(email: string): Promise<{ id: number } | undefined> {
    try {
      const emailDuplicateCheckSQL = `SELECT id FROM TB_USERS WHERE email = '${email}'`;
      const emailDuplicateCheckResult = await selectOne(emailDuplicateCheckSQL);

      return emailDuplicateCheckResult;
    } catch (err) {
      logger.error('UsersModels duplicateEmailCheck()', err);
      throw err;
    }
  }

  public async existingUserCheck(email: string, accessId: string): Promise<{ id: number } | undefined> {
    try {
      const existingUserCheckSQL = `SELECT id FROM TB_USERS WHERE email = '${email}' OR kartRiderAccessId = '${accessId}'`;
      const existingUserCheckResult = await selectOne(existingUserCheckSQL);

      return existingUserCheckResult;
    } catch (err) {
      logger.error('UsersModels existingUserCheck()', err);
      throw err;
    }
  }

  public async getMyInformation(userId: number): Promise<UserType> {
    try {
      const getUserInfoSQL = `
          SELECT
          id, kartRiderAccessId, email, clubId, profileImageUri, rating, isWithdrawal
          FROM TB_USERS
          WHERE id = ${userId}
        `;
      const userInfoResult = await selectOne(getUserInfoSQL);

      return userInfoResult;
    } catch (err) {
      logger.error('UsersModels getMyInformation()', err);
      throw err;
    }
  }

  public async findEmail(accessId: string): Promise<string> {
    try {
      const findEmailSQL = `SELECT REPLACE(email, substring(email, 1, 3),'***') AS email FROM TB_USERS WHERE kartRiderAccessId = '${accessId}'`;
      const findEmailResult = await selectOne(findEmailSQL);

      return findEmailResult;
    } catch (err) {
      logger.error('UsersModels findEmail()', err);
      throw err;
    }
  }

  public async findPassword(data: { email: string, accessId: string }): Promise<string> {
    try {
      const { email, accessId } = data;
      const findUserInfoSQL = `SELECT id FROM TB_USERS WHERE email = '${email}' AND kartRiderAccessId = '${accessId}'`;
      const findUserInfoResult = await selectOne(findUserInfoSQL);

      if (!findUserInfoResult) {
        return 'no-user-info';
      }

      const userId = findUserInfoResult.id;
      const newPassword = Math.random().toString(36).substr(2, 11);
      const hashedPassword = bcrypt.hashSync(newPassword, 11);
      const updateNewPasswordSQL = `UPDATE TB_USERS SET password = '${hashedPassword}' WHERE id = ${userId}`;
      await pool.execute(updateNewPasswordSQL);

      return newPassword;
    } catch (err) {
      logger.error('UsersModels findPassword()', err);
      throw err;
    }
  }
}
