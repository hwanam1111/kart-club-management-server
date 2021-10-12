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

      const alreadyClubRegisterdApplicationCheckSQL = 'SELECT id FROM TB_CLUBS WHERE masterUserId = ?';
      const alreadyClubRegisterdApplicationCheckResult = await selectOne(alreadyClubRegisterdApplicationCheckSQL, [userId]);
      if (alreadyClubRegisterdApplicationCheckResult) {
        return 'already-application';
      }

      const alreadyClubNameRegisterdCheckSQL = 'SELECT id FROM TB_CLUBS WHERE clubName = ?';
      const alreadyClubNameRegisterdCheckResult = await selectOne(alreadyClubNameRegisterdCheckSQL, [clubName]);
      if (alreadyClubNameRegisterdCheckResult) {
        return 'already-registered-club-name';
      }

      const addClubSQL = `
        INSERT INTO TB_CLUBS (
          clubName, masterUserId, masterAccessId, verifyMasterImageUrl, createdAt
        ) VALUES (
          ?, ?, ?, ?, NOW()
        )
      `;
      const clubId = await insertAndGetLastId(addClubSQL, [clubName, userId, kartRiderAccessId, verifyMasterImageUrl]);

      const updateMyClubInfoSQL = 'UPDATE TB_USERS SET clubId = ?, rating = \'클럽 등록 신청 중\' WHERE id = ?';
      await pool.execute(updateMyClubInfoSQL, [clubId, userId]);

      const addClubRegisterApplicationLogSQL = `
        INSERT INTO TB_CLUBS_REGISTER_APPLICATION_LOGS (
          enteredClubName, applicantUserId, resultMessage, createdAt
        ) VALUES (
          ?, ?, '클럽 등록 신청완료.', NOW()
        )
      `;
      await pool.execute(addClubRegisterApplicationLogSQL, [clubName, userId]);

      return 'club-register-application-success';
    } catch (err) {
      logger.error('ClubModels loginLog()', err);
      throw err;
    }
  }
}
