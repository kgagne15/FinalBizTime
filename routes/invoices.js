const express = require('express');
const router = express.Router();
const db = require("../db");
const ExpressError = require('../expressError');


//Get request to return all invoices' id and comp_code
router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({invoices: results.rows})
    } catch(e) {
        return next(e);
    }
})

//Get request to return specific invoice and its company information
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        //previously had the below but saw that the answer used a join
        // const invoiceResults = await db.query(`SELECT id, amt, paid, add_date, paid_date
        // FROM invoices WHERE id=$1
        // `, [id]);
        // let comp_code = await db.query(`SELECT comp_code FROM invoices WHERE id=$1`, [id])
        // comp_code = comp_code.rows[0].comp_code
        // const companyResults = await db.query(`SELECT * FROM companies WHERE code=$1`, [comp_code])
        // return res.json({invoice: invoiceResults.rows[0], company: companyResults.rows[0]})
        const results = await db.query(`
            SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description
            FROM invoices as i JOIN companies as c ON i.comp_code=c.code
            WHERE i.id=$1`, [id])
        if (results.rows.length === 0) {
            throw new ExpressError(`Cannot find invoice with id of ${id}`, 404)
        };
        const invoice = {
            id: results.rows[0].id,
            amt: results.rows[0].amt,
            paid: results.rows[0].paid,
            add_date: results.rows[0].add_date,
            paid_date: results.rows[0].paid_date,
            company: {
                code: results.rows[0].code,
                name: results.rows[0].name,
                description: results.rows[0].description
            }
        }
        return res.json({invoices: invoice})
    } catch(e) {
        return next(e);
    }
});


//Post request to create new invoice with minimum requirements of comp_code and amount
router.post('/', async (req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        const results = await db.query(
            `
            INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date
            `, [comp_code, amt]
        )
        return res.status(201).json({invoice: results.rows[0]})
    } catch(e) {
        return next(e);
    }
});


//Put request to update specific invoice, copied from solution
router.put('/:id', async (req, res, next) => {
    try {
        // const { id } = req.params;
        // const { amt, paid } = req.body;
        // let paidDate = null;
        
        // const currResults = await db.query(`
        // SELECT paid FROM invoices WHERE id=$1`, [id])

        // if (currResults.rows.length === 0 ){
        //     throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        // }

        // const currPaidDate = currResult.rows[0].paid_date;

        // if (!currPaidDate && paid) {
        //     paidDate = new Date();
        // } else if (!paid) {
        //     paidDate = null;
        // } else {
        //     paidDate = currPaidDate;
        // }
        // const results = await db.query(`UPDATE invoices
        // SET amt=$1, paid=$2, paid_date=$3 
        // WHERE id=$4
        // RETURN id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paidDate, id])

    

        // // if (results.rows.length === 0) {
        // //     throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
        // // }
        // return res.json({invoice: results.rows[0]})



        let {amt, paid} = req.body;
        let id = req.params.id;
        let paidDate = null;
    
        const currResult = await db.query(
              `SELECT paid
               FROM invoices
               WHERE id = $1`,
            [id]);
    
        if (currResult.rows.length === 0) {
          throw new ExpressError(`No such invoice: ${id}`, 404);
        }
    
        const currPaidDate = currResult.rows[0].paid_date;
    
        if (!currPaidDate && paid) {
          paidDate = new Date();
        } else if (!paid) {
          paidDate = null
        } else {
          paidDate = currPaidDate;
        }
    
        const result = await db.query(
              `UPDATE invoices
               SET amt=$1, paid=$2, paid_date=$3
               WHERE id=$4
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]);
    
        return res.json({"invoice": result.rows[0]});
    } catch(e) {
        return next(e);
    }
});


//Delete request to delete specific invoice
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const results = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id])
        if (results.rows.length === 0) {
            throw new ExpressError(`There is no invoice with id of ${id}`, 404)
        }
        return res.send({"status": "deleted"})
    } catch(e) {
        return next(e);
    }
})

module.exports = router;