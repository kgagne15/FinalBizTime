const express = require('express');
const slugify = require('slugify');
const router = express.Router();
const db = require("../db");
const ExpressError = require('../expressError');


//Get request for all companies and their code and name
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT code, name FROM companies`);
        return res.json({companies: results.rows}); 
    } catch(e) {
        return next(e);
    }
});

//Get request for specific company's code, name, and description
router.get('/:code', async (req, res, next) => {
    try {
        const code = req.params.code;
        const indResults = await db.query(`
        SELECT i.name FROM industries as i JOIN industries_companies 
        ON i.code=industries_companies.ind_code
        WHERE comp_code=$1
    `, [code])
        const companyResults = await db.query(`
        SELECT * FROM companies
        WHERE code = $1`, 
        [code]);
        const invoiceResults = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [code])
        if (companyResults.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}`, 404)
        }
        const company = companyResults.rows[0];
        company.invoices = invoiceResults.rows;
        company.industries = indResults.rows;
        return res.json({company: company})
    } catch(e) {
        return next(e)
    }
});

//Post request to create a new company
router.post('/', async (req, res, next) => {
    try {
        const { name, description} = req.body;
        const code = slugify(name);
        const results = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
        [code, name, description])
        return res.status(201).json({company: results.rows[0]})
    } catch(e) {
        return next(e);
    }
});

//Put request to edit an existing company
router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description} = req.body;
       
        const results = await db.query(`
        UPDATE companies SET name=$1, description=$2
        WHERE code=$3
        RETURNING code, name, description`,
        [name, description, code])
        if (results.rows.length === 0) {
            throw new ExpressError(`Can't update company with code of ${code}`, 404)
        }
        return res.json({company: results.rows[0]})
    } catch(e) {
        return next(e);
    }
})

//Delete request to delete a specific company
router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`, [code])
        if (results.rows.length === 0) {
            throw new ExpressError(`There is no company with code of ${code}`, 404)
        }
        return res.send({"status": "deleted"})
    } catch(e) {
        return next(e);
    }
})


module.exports = router;