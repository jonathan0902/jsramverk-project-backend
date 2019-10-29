/**
 * Connect to the database and search using a criteria.
 */
"use strict";

// MongoDB
const mongo = require("mongodb").MongoClient;
const dsn =  process.env.DBWEBB_DSN || "mongodb://localhost:27017/jhellberg";
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcryptjs');
const saltRounds = 10;

router.post('/add/', async (request, response) => {
    try {
        let user = await findInCollection(dsn, "user", {}, {}, 3, request.body.email);
        let money = parseInt(request.body.money) + parseInt(user[0].amount);
        console.log(money)
        let res = await updateInCollection(dsn, "user", {}, {}, 3, [request.body.email, money]);

        response.json(res);
    } catch (err) {
        response.json(err);
    }
});

router.post('/get/', async (request, response) => {
    try {
        let user = await findInCollection(dsn, "user", {}, {}, 3, request.body.email);

        response.json(user);
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
    const res = await col.find({ email: { $eq: username } }).limit(limit).toArray();

    await client.close();

    return res.reverse();
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
