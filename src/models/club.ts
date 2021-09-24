import mysql from 'mysql2/promise';

import mysqlConfig from '../mysql/config';
import logger from '../../config/winston';
import { selectOne, insertAndGetLastId } from '../lib/mysqlConnectionPool';

const pool = mysql.createPool(mysqlConfig);

export default class ClubModels {
  public async clubRegister(data: {
    userId: number,
    kartRiderAccessId: string,
    clubName: string,
    verifyMasterImageUrl: string
  }): Promise<string> {
    try {
      const { userId, kartRiderAccessId, clubName, verifyMasterImageUrl } = data;

      const alreadyClubRegisterdApplicationCheckSQL = `SELECT id FROM TB_CLUBS WHERE masterUserId = ${userId}`;
      const alreadyClubRegisterdApplicationCheckResult = await selectOne(alreadyClubRegisterdApplicationCheckSQL);
      if (alreadyClubRegisterdApplicationCheckResult) {
        return 'already-application';
      }

      const alreadyClubNameRegisterdCheckSQL = `SELECT id FROM TB_CLUBS WHERE clubName = '${clubName}'`;
      const alreadyClubNameRegisterdCheckResult = await selectOne(alreadyClubNameRegisterdCheckSQL);
      if (alreadyClubNameRegisterdCheckResult) {
        return 'already-registered-club-name';
      }

      const addClubSQL = `
        INSERT INTO TB_CLUBS (
          clubName, masterUserId, masterAccessId, verifyMasterImageUrl, createdAt
        ) VALUES (
          '${clubName}', ${userId}, '${kartRiderAccessId}', '${verifyMasterImageUrl}', NOW()
        )
      `;
      const clubId = await insertAndGetLastId(addClubSQL);

      const updateMyClubInfoSQL = `UPDATE TB_USERS SET clubId = ${clubId}, rating = '클럽 등록 신청 중' WHERE id = ${userId}`;
      await pool.execute(updateMyClubInfoSQL);

      const addClubRegisterApplicationLogSQL = `
        INSERT INTO TB_CLUBS_REGISTER_APPLICATION_LOGS (
          enteredClubName, applicantUserId, resultMessage, createdAt
        ) VALUES (
          '${clubName}', ${userId}, '클럽 등록 신청완료.', NOW()
        )
      `;
      await pool.execute(addClubRegisterApplicationLogSQL);

      return 'club-register-application-success';
    } catch (err) {
      logger.error('ClubModels loginLog()', err);
      throw err;
    }
  }
}
