const express = require('express');
const router = express.Router();
//const ExpressError = require('./expressError');
const db = require("../db");

router.get('/', async (req, res, next) => {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json(results.rows);
});



module.exports = router;