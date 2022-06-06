import * as url from 'url';
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import path from 'path';
import express from 'express';
import mysql from 'mysql';

const PORT = 8080;
const app = express();

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), 
path.join(__dirname, 'views/Page'),
path.join(__dirname, 'views/Admin')]);

app.use('/public', express.static(path.resolve('public')));

const pool = mysql.createPool({
    user: 'root',
    password: '',
    database: 'dtbs_ptmt',
    host: 'localhost',
    connectionLimit: 10
});

const dbConnect = () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if(err) {
                reject(err);
            } else{
                resolve(conn);
            }
        })
    })
}

const getUsers = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT username_admin FROM admin', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
    })
}

app.get('/', async (req, res) => {
    const conn = await dbConnect();
    const users = await getUsers(conn);
    conn.release();
    res.render('loginpage', {
        users
    });
});

app.get('/ChangePass', (req, res) => {
    res.render('ChangePass');
});

app.get('/menu', (req, res) => {
    res.render('menu');
});

app.get('/periode', async (req, res) => {
    const conn = await dbConnect();
    const users = await getUsers(conn);
    conn.release();
    res.render('periode', {
        users
    });
});

app.get('/dataMurid', (req, res) => {
    res.render('dataMurid');
});

app.get('/dataGuru', (req, res) => {
    res.render('dataGuru');
});

app.get('/daftarHadir', (req, res) => {
    res.render('daftarHadir');
});

app.listen(PORT, () => {
    console.log(`Server is ready, listening on port ${PORT}`);
});



