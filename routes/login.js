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

router.post('/get/', async (request, response) => {

    const payload = { email: request.body.email };
    const secret = process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '1h'});

    try {
        let res = await findInCollection(dsn, "user", {}, {}, 3, request.body.email);

        if(res === undefined || res.length == 0) {
            response.json({ message: "Username or Password didn't match.", status: "failed"});
        }

        if(bcrypt.compareSync(request.body.password, res[0].password)) {
            response.json({login: res, token: token, status: "success"});
        } else {
            response.json({ message: "Username or Password didn't match.", status: "failed"});
        }

    } catch (err) {
        response.json(err);
    }
});

router.post('/register/', async (request, response) => {
    let params = [request.body.email, request.body.password, request.body.name, request.body.lastname];

    let salt = bcrypt.genSaltSync(saltRounds);
    params[1] = bcrypt.hashSync(request.body.password, salt);

    try {
        let res = await insertInCollection(dsn, "user", {}, {}, 0, params);

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
    const res = await col.find({ email: { $eq: username } }).limit(limit).toArray();

    await client.close();

    return res.reverse();
}

async function insertInCollection(dsn, colName, criteria, projection, limit, req) {
    const client  = await mongo.connect(dsn);
    const db = await client.db();
    const col = await db.collection(colName);
    const res = await col.insertOne({email: req[0], password: req[1], name: req[2], lastname: req[3], amount: 200});

    await client.close();

    return req;
}

module.exports = router;
