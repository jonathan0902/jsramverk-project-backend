/**
 * Connect to the database and search using a criteria.
 */
"use strict";

// MongoDB
const mongo = require("mongodb").MongoClient;
const dsn =  process.env.DBWEBB_DSN || "mongodb://localhost:27017/jhellberg";
const express = require('express');
const router = express.Router();

router.get('/companys/', async (request, response) => {

    try {
        let res = await findInCollection(dsn, "company", {}, {}, 0);

        response.json({res, status: "success"});

    } catch (err) {
        response.json(err);
    }
});

router.post('/get/', async (request, response) => {

    try {
        let res = await findInCollection(dsn, "stocks", {email: { $eq: request.body.email }, company: { $eq: request.body.company }}, {}, 0);

        response.json({res, status: "success"});

    } catch (err) {
        response.json(err);
    }
});

router.post('/amount/', async (request, response) => {

    try {
        let res = await findInCollection(dsn, "stocks", {email: { $eq: request.body.email }, company: { $eq: request.body.company }}, {}, 0);

        let amount = 0;

        for(let i = 0; i < res.length; i++) {
            if(res[i].status == "Buy") {
                amount = amount + res[i].amount
            } else {
                amount = amount - res[i].amount
            }
        }

        response.json({amount, status: "success"});

    } catch (err) {
        response.json(err);
    }
});

router.post('/get/map/', async (request, response) => {
    let state = true;
    try {
        let res = await findmapCollection(dsn, "stock", {company: { $eq: request.body.company }}, { _id: 0, company: 1, date: 0, value: 1}, 0);
        if(res[res.length-1] > res[res.length-2]) {
            state = true;
        } else {
            state = false;
        }
        response.json({res, status: "success", value: res[res.length-1], state: state});

    } catch (err) {
        response.json(err);
    }
});

router.post('/buy/', async (request, response) => {
    let params = [request.body.email, request.body.company, request.body.amount, request.body.price, 'Buy'];

    try {
        let user = await findInCollection(dsn, "user", {}, {}, 3, request.body.email);
        let res = await insertInCollection(dsn, "stocks", {}, {}, 0, params);
        let amount = user[0].amount - (request.body.amount * request.body.price);

        if(amount > 0) {
            await updateInCollection(dsn, "user", {}, {}, 3, [request.body.email, amount]);

            response.json({status: "true"});
        }

        response.json({status: "false"});
        
    } catch (err) {
        response.json(err);
    }
});

router.post('/sell/', async (request, response) => {
    let params = [request.body.email, request.body.company, request.body.amount, request.body.price, 'Sell'];

    try {
        let user = await findInCollection(dsn, "user", {}, {}, 3, request.body.email);
        let res = await insertInCollection(dsn, "stocks", {}, {}, 0, params);
        let amount = user[0].amount + (request.body.amount * request.body.price);
        await updateInCollection(dsn, "user", {}, {}, 3, [request.body.email, amount]);

        response.json(res);
    } catch (err) {
        response.json(err);
    }
});

/**
 * Find documents in an collection by matching search criteria.
 *
 * @async
 *
 * @param {string} dsn        DSN to connect to database.
 * @param {string} colName    Name of collection.
 * @param {object} criteria   Search criteria.
 * @param {object} projection What to project in results.
 * @param {number} limit      Limit the number of documents to retrieve.
 *
 * @throws Error when database operation fails.
 *
 * @return {Promise<array>} The resultset as an array.
 */
async function findInCollection(dsn, colName, criteria, projection, limit, username) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.find(criteria).limit(limit).toArray();

    await client.close();

    return res.reverse();
}

async function findmapCollection(dsn, colName, criteria, projection, limit, username) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.find(criteria, projection).toArray();
    let dre = [];

    await client.close();

    for(let i = 0; i < res.length; i++) {
        dre.push(res[i].value)
    }

    return dre;
}

async function insertInCollection(dsn, colName, criteria, projection, limit, req) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.insertOne({email: req[0], company: req[1], amount: req[2], price: req[3], status: req[4]});

    await client.close();

    return req;
}

async function updateInCollection(dsn, colName, criteria, projection, limit, req) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.update({email: req[0]}, {$set: {amount: req[1]}});

    await client.close();

    return req;
}

module.exports = router;
