// const { Pool } = require('pg');
// const express = require('express');
// const port  = 3000;

// const app = express();

const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    user: 'node_user',
    port: 5432,
    database: 'TrainTicketBooking',
    password: 'karthick'
});

module.exports = pool;