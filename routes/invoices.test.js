// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;
let testCompany;

beforeEach(async function() {
    let compResult = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('test', 'TestCompany', 'This is a test company')
        RETURNING code, name, description
    `);
    testCompany = compResult.rows[0];

    let invoiceResult = await db.query(`
        INSERT INTO invoices (comp_Code, amt, paid, paid_date)
        VALUES ('test', 123, false, null)
        RETURNING id, comp_Code, amt, paid, paid_date, add_date
    `);
    testInvoice = invoiceResult.rows[0];
});


describe("GET /invoices", function() {
    test("Get list of invoices", async function() {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoices: [{id: testInvoice.id, comp_code: testInvoice.comp_code}]
        });
    });
});


describe("GET /invoices/:id", function() {
    test("Get specific invoice info", async function() {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({invoices: {
            id: testInvoice.id,
            amt: testInvoice.amt,
            paid: testInvoice.paid,
            // add_date: testInvoice.add_date,
            add_date: expect.any(String),
            paid_date: testInvoice.paid_date,
            company: {
                code: testCompany.code,
                name: testCompany.name,
                description: testCompany.description
        }}});
    });

    test("Get invoice that does not exist", async function() {
        const response = await request(app).get(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});

//Copied post test solution
describe("POST /", function () {

    test("It should add invoice", async function () {
      const response = await request(app)
          .post("/invoices")
          .send({amt: 400, comp_code: testCompany.code});
  
      expect(response.body).toEqual(
          {
            "invoice": {
              id: expect.any(Number),
              comp_code: "test",
              amt: 400,
              add_date: expect.any(String),
              paid: false,
              paid_date: null,
            }
          }
      );
    });
  });


describe("PUT /invoices/:id", function() {
    test("Updates a single invoice", async function() {
        const response = await request(app).put(`/invoices/${testInvoice.id}`).send({amt: 3000, paid: false});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {id: testInvoice.id, comp_code: testCompany.code, 
            "amt": 3000, "paid": false, "add_date": expect.any(String),
            "paid_date": null}
        });
    });
    test("Update invoice that does not exist", async function() {
        const response = await request(app).put(`/invoices/0`);
        expect(response.statusCode).toEqual(404);
    });
});
  

describe("DELETE /invoices/:id", function() {
    test("Deletes a single invoice", async function() {
        const response = await request(app).delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"});
    });
});


afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
  });
  
  afterAll(async function() {
    // close db connection
    await db.end();
  });
  