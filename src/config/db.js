const { Pool } = require('pg');

const pool = new Pool({
  host: '34.86.121.148',
  user: 'postgres',
  password: '6L@d5QL',
  database: 'gg',
  port: 5432,
});

module.exports = pool;