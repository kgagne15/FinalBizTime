const express = require('express');
const router = express.Router();
const db = require("../db");
const ExpressError = require('../expressError');


//Not showing all, just showing those associated with a company
router.get('/', async(req, res, next) => {
    try {      
        const results = await db.query(`
        SELECT i.code, c.name AS comp_name, i.name FROM industries AS i
        JOIN industries_companies AS ic ON i.code=ic.ind_code
        JOIN companies AS c ON c.code=ic.comp_code
        `);
        return res.json({industries: results.rows})
    } catch(e) {
        return next(e);
    }
});



router.post("/", async(req, res, next) => {
    try {
        const {code, name} = req.body;
        const results = await db.query(`INSERT INTO industries (code, name)
        VALUES ($1, $2)
        RETURNING code, name`, [code, name]);
        return res.status(201).json({industry: results.rows[0]})
    } catch(e) {
        return next(e);
    }
});


router.put('/', async (req, res, next) => {
    try {
        const {comp_code, ind_code} = req.body;
        const results = await db.query(`
            INSERT INTO industries_companies (comp_code, ind_code)
            VALUES ($1, $2)
            RETURNING comp_code, ind_code`, [comp_code, ind_code])
            return res.json({industry_company: results.rows[0]})
    } catch(e) {
        return next(e);
    }
})


module.exports = router;