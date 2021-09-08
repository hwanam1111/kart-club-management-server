import mysql from 'mysql2/promise';
import mysqlConfig from '../mysql/config';

const pool = mysql.createPool(mysqlConfig);

export const selectOne = async (sql: string) => {
  const result = await pool.execute(sql);

  if (!result[0]) {
    return result[0];
  }

  return result[0][0];
};

export const selectAll = async (sql: string) => {
  const result = await pool.execute(sql);

  return result[0];
};