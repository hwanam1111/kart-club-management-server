import mysql from 'mysql2/promise';
import mysqlConfig from '../mysql/config';

const pool = mysql.createPool(mysqlConfig);

export const selectOne = async (sql: string, statements?: Array<any>): Promise<any> => {
  const result = statements.length === 0 ? await pool.execute(sql) : await pool.execute(sql, statements);

  if (!result[0]) {
    return result[0];
  }

  return result[0][0];
};

export const selectAll = async (sql: string, statements?: Array<any>): Promise<Array<any>> => {
  const result = statements.length === 0 ? await pool.execute(sql) : await pool.execute(sql, statements);

  return JSON.parse(JSON.stringify(result[0]));
};

export const insertAndGetLastId = async (sql: string, statements?: Array<any>): Promise<number> => {
  const result = statements.length === 0 ? await pool.execute(sql) : await pool.execute(sql, statements);

  return JSON.parse(JSON.stringify(result[0])).insertId;
};
