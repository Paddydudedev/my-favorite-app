const dotenv = require('dotenv');
dotenv.config()

const {Pool} = require('pg');

exports.pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.DB_HOST || '0.0.0.0',
    database: 'eth_keys',
    password: process.env.POSTGRES_PASSWORD,
    port: 5433
  })