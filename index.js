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
path.join(__dirname, 'views/Admin'),
path.join(__dirname, 'views/Siswa')]);

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


//--------- LOGIN -------
app.get('/', async (req, res) => {
    const conn = await dbConnect();
    const users = await getUsers(conn);
    conn.release();
    res.render('loginpage', {
        users
    });
});

app.post('/auth', function(request, response) {
    let username = request.body.username_admin;
	let password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM admin WHERE username_admin = ? AND pass_admin = ?', 
        [username_admin, pass_admin], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                request.session.loggedin = true;
				request.session.username_admin = username_admin;
                response.redirect('/home');
            } else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username_admin + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

app.get('/ChangePass', (req, res) => {
    res.render('ChangePass');
});


//--------- ADMIN -------
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


//--------- SISWA -------
app.get('/menusiswa', (req, res) => {
    res.render('menusiswa');
})

app.get('/datasiswa', (req, res) => {
    res.render('datasiswa');
})

app.get('/dataperiode', (req, res) => {
    res.render('dataperiode');
})

app.get('/statusptmt', (req, res) => {
    res.render('statusptmt');
})
app.listen(PORT, () => {
    console.log(`Server is ready, listening on port ${PORT}`);
});



