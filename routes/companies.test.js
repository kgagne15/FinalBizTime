// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");


let testCompany;
let testIndustry; 
let testIndustryCompany;

beforeEach(async function() {
    let result = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('test', 'TestCompany', 'This is a test company')
        RETURNING code, name, description
    `);
    testCompany = result.rows[0];

    let indResult = await db.query(`
        INSERT INTO industries (code, name)
        VALUES ('tech', 'Information Technology')
        RETURNING code, name
    `)
    testIndustry = indResult.rows[0]

    let indCompResult = await db.query(`
        INSERT INTO industries_companies (comp_code, ind_code)
        VALUES ('test', 'tech')
        RETURNING comp_code, ind_code
    `)  
    testIndustryCompany = indCompResult.rows[0]
});

describe("GET /companies", function() {
    test("Get list of companies", async function() {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [{code: testCompany.code, name: testCompany.name}]
        });
    });
});

describe("GET /companies/:code", function() {
    test("Get specific company info", async function() {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({company: {code: testCompany.code, description: testCompany.description,
            invoices: [], name: testCompany.name, industries: [{"name": "Information Technology"}]}});
    });

    test("Get company that does not exist", async function() {
        const response = await request(app).get(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("POST /companies", function() {
    test("Create new company", async function() {
        const response = await request(app).post('/companies').send({
            code: expect.any(String),
            name: "Gagne corporation",
            description: "Definitely a real company"
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({company: {code: expect.any(String), name: "Gagne corporation", description: "Definitely a real company"}})
    });
});

describe("PUT /companies/:code", function() {
    test("Updates a single company", async function() {
        const response = await request(app).put(`/companies/${testCompany.code}`).send({name: "NEW TEST", description: "Testing put"});
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {code: "test", name: "NEW TEST", description: "Testing put"}
        });
    });
    test("Update company that does not exist", async function() {
        const response = await request(app).put(`/companies/0`);
        expect(response.statusCode).toEqual(404);
    });
});


describe("DELETE /companies/:code", function() {
    test("Deletes a single company", async function() {
        const response = await request(app).delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({status: "deleted"});
    });
});


afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM industries");
    await db.query("DELETE FROM industries_companies");
  });
  
  afterAll(async function() {
    // close db connection
    await db.end();
  });
  