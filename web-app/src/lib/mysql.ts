import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

let pool: mysql.Pool;

if (!global._mysqlPool) {
  global._mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'motorsport_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

pool = global._mysqlPool;

export default pool;

