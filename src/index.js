const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config();

const auth = require('./routes/auth');
const { dbConfig } = require('./config');
const { isLoggedin } = require('./middleware');
const { resourceUsage } = require('process');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/routes/auth', auth);

// Multer set up for images

const generateFileName = (req, file, cb) => {
  cb(null, new Date().getTime() + file.originalname);
};

const diskStorage = multer.diskStorage({
  destination: './uploads',
  filename: generateFileName,
});

const uploadImages = multer({
  storage: diskStorage,
});

//Uploading images to local device

app.post('/uploads', uploadImages.single('image'), (req, res) => {
  res.send('https://localhost:3000/' + req.file.path);
});

app.get('/uploads/:fileName', (req, res) => {
  const fileLocation = path.resolve('./uploads/' + req.params.fileName);
  res.sendFile(fileLocation);
});

//Delete request by id

app.delete('/books/:id', isLoggedin, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(
      `DELETE FROM books WHERE books.id = ${mysql.escape(req.params.id)}`,
    );
    await con.end();
    res.send(data);
  } catch {
    res.status(500).send({ err: 'Server error' });
  }
});

// GET product by id

app.get('/product/item=:id', isLoggedin, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(
      `SELECT * FROM books LEFT JOIN users ON books.user_id = users.id WHERE books.id = ${mysql.escape(
        req.params.id,
      )}`,
    );
    await con.end();
    res.send(data);
  } catch {
    res.status(500).send({ err: 'Server error' });
  }
});

// GET books by id

app.get('/user-books', isLoggedin, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(
      `SELECT * FROM books WHERE books.user_id = '${req.userData.id}'`,
    );
    await con.end();
    res.send(data);
  } catch {
    res.status(500).send('DB error');
  }
});

// GET All books

app.get('/books', async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`SELECT * FROM books`);
    await con.end();
    res.send(data);
  } catch {
    res.status(500).send({ err: 'Whoopsy, DB Error!' });
  }
});

//GET user info

app.get('/user', isLoggedin, async (req, res) => {
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(
      `SELECT * FROM users WHERE users.id = '${req.userData.id}'`,
    );
    await con.end();
    res.send(data);
  } catch {
    res.status(500).send({ err: 'Whoopsy, DB Error!' });
  }
});

// POST new book with file name

app.post(
  '/books',
  isLoggedin,
  uploadImages.single('image'),
  async (req, res) => {
    let userInput = req.body;
    try {
      const con = await mysql.createConnection(dbConfig);
      const [data] =
        await con.execute(`INSERT INTO books (book,author,description,user_id,price,image) VALUES(${mysql.escape(
          userInput.book,
        )},
    ${mysql.escape(userInput.author)},
    ${mysql.escape(userInput.description)},
    ${mysql.escape(req.userData.id)},
      ${mysql.escape(userInput.price)},
      '${req.file.filename}'
      )
  `);
      await con.end();
      res.send(data);
    } catch {
      res.status(400).send({ err: 'Invalid data passed! please try' });
    }
  },
);

//Updating users info

app.put('/user', isLoggedin, async (req, res) => {
  let userInput = req.body;
  try {
    const con = await mysql.createConnection(dbConfig);
    const [data] = await con.execute(`UPDATE users SET
       name = CASE
        WHEN '${userInput.name}' = 'undefined'
        THEN name
        ELSE '${userInput.name}'
      END,
      surname = CASE
      WHEN '${userInput.surname}' = 'undefined'
      THEN surname
      ELSE '${userInput.surname}'
      END,
      email = CASE
      WHEN '${userInput.email}' = 'undefined'
      THEN email
      ELSE '${userInput.email}'
      END,
      phone = CASE
      WHEN '${userInput.phone}' = 'undefined'
      THEN phone
      ELSE '${userInput.phone}'
      END
       WHERE users.id = ${mysql.escape(req.userData.id)}
  `);
    await con.end();
    res.send(data);
  } catch {
    res.status(400).send({ err: 'ble' });
  }
});

app.get('/', (req, res) => {
  res.send({ msg: 'Server is running' });
});

app.all('*', (req, res) => {
  res.status(404).send({ error: 'Page not found' });
});

const port = 3000;

app.listen(port, () => console.log(`Listening on port ${port}`));
