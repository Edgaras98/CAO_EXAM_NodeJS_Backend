const express = require('express');
const mysql = require('mysql2/promise');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbConfig, jswtSecret } = require('../config');
const router = express.Router();

//Validation schema

const userSchema = Joi.object({
  name: Joi.string(),
  surname: Joi.string(),
  phone: Joi.string(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().trim().required(),
});

//Register validation

router.post('/register', async (req, res) => {
  let userInput = req.body;
  try {
    userInput = await userSchema.validateAsync(userInput);
  } catch (err) {
    return res.status(400).send({ err: 'Incorrect data provided!' });
  }
  try {
    const encryptedPassword = bcrypt.hashSync(userInput.password);
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`
        INSERT INTO users (name,surname,phone,email,password)
        VALUES (${mysql.escape(userInput.name)},
        ${mysql.escape(userInput.surname)},
        ${mysql.escape(userInput.phone)}, 
          ${mysql.escape(userInput.email)}, '${encryptedPassword}')
    `);
    await con.end();
    return res.send(data);
  } catch (err) {
    res.status(500).send({ err: 'Failed to register, please try again' });
  }
});

// Login validation

router.post('/login', async (req, res) => {
  let userInput = req.body;
  try {
    userInput = await userSchema.validateAsync(userInput);
  } catch (err) {
    return res.status(400).send({ err: 'Incorrect email or pass provided!' });
  }

  try {
    const encryptedPassword = bcrypt.hashSync(userInput.password);
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`
      SELECT * FROM users WHERE email=${mysql.escape(userInput.email)}`);
    await con.end();
    if (data.length === 0) {
      return res.status(400).send({ err: 'Unexpected error please try again' });
    }
    const isAuthed = bcrypt.compareSync(userInput.password, data[0].password);

    if (isAuthed) {
      const token = jwt.sign(
        {
          id: data[0].id,
          email: data[0].email,
        },
        jswtSecret,
      );
      return res.send({ msg: 'Successfully logged in', token });
    }
    return res.status(500).send({ err: 'incorrect data passed!' });
  } catch (err) {
    res.status(400).send({ err: 'Failed to authorize' });
  }
});

module.exports = router;
