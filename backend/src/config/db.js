import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const toPostgresQuery = (sql, values = []) => {
  let index = 0;
  const text = sql.replace(/\?/g, () => `$${++index}`);
  return { text, values };
};

const pool = {
  async query(sql, values = []) {
    const query = toPostgresQuery(sql, values);
    const isInsert = /^\s*INSERT\s/i.test(sql);
    const text = isInsert && !/\bRETURNING\b/i.test(query.text)
      ? `${query.text} RETURNING id`
      : query.text;
    const result = await pgPool.query({ ...query, text });

    if (isInsert) {
      return [{ insertId: result.rows[0]?.id, rows: result.rows }, result];
    }

    return [result.rows, result];
  },
  async end() {
    return pgPool.end();
  },
};

export default pool;
