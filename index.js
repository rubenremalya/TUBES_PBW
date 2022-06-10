import * as url from 'url';
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import path from 'path';
import express from 'express';
import mysql from 'mysql';
import session from 'express-session';
import multer from 'multer';
import readXlsxFile from 'read-excel-file';
import bodyParser from 'body-parser';

const PORT = 8080;
const app = express();

app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views'), 
path.join(__dirname, 'views/Page'),
path.join(__dirname, 'views/Admin'),
path.join(__dirname, 'views/Siswa'),
path.join(__dirname, 'views/Guru'),
path.join(__dirname, 'views/Kepsek'),
path.join(__dirname, 'views/Satpam')]);

app.use('/public', express.static(path.resolve('public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

const connection = mysql.createConnection({
    user: 'root',
    password: '',
    database: 'dtbs_ptmt',
    host: 'localhost',
    connectionLimit: 10
});


//--------- LOGIN -------
app.get('/', function (req, res) {
	res.render('loginpage');
});

app.get('/', async (req, res) => {
    const conn = await dbConnect();
    const users = await getUsers(conn);
    conn.release();
    if (req.session.loggedin) {
		res.send('Welcome back, ' + req.session.username + '!');
	} else {
		res.send('Please login to view this page!');
	}
	res.end();
    res.render('loginpage', {
        users
    });
});

app.post('/auth', function(req, res) {
	let username = req.body.username;
	let password = req.body.password;
	if (username && password) {
		connection.query('SELECT * FROM admin WHERE username_admin = ? AND pass_admin = ?', [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/menu');
			} else {
				res.redirect('/incorrect');
			}			
			res.end();
		});
	} else {
		res.redirect('/');
		res.end();
	}
});

app.get('/ChangePass', (req, res) => {
    res.render('ChangePass');
});

app.get('/incorrect', (req, res) => {
    res.render('incorrect');
})

//--------- ADMIN -------
app.get('/menu', (req, res) => {
    res.render('menu');
});

app.get('/periode', async (req, res) => {
    res.render('periode')
});

app.post('/periode', function(req, res) {
    let comm = "INSERT INTO periode SET ?";
    let isi = {kapasitas: req.body.jumlah, nama_perioda: req.body.Fname, tanggal_mulai: req.body.mulai,
        tanggal_akhir: req.body.akhir, nama_perioda2: req.body.Fname2, tgl_mulaidaftar: req.body.Mdaftar, tgl_akhirdaftar: req.body.Adaftar};
		connection.query(comm, isi, function(error, results, fields) {
			if (error) throw error;
			res.redirect('/periode');
			res.end();
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


//--------- GURU -------
app.get('/menuguru', (req, res) => {
    res.render('menuguru');
})

app.get('/infoguru', (req, res) => {
    res.render('infoguru');
})

app.get('/daftarsiswa', (req, res) => {
    res.render('daftarsiswa');
});


//--------- KEPSEK -------
app.get('/menukepsek', (req, res) => {
    res.render('menukepsek');
})

app.get('/grafiktrendptmt', (req, res) => {
    res.render('grafiktrendptmt');
})

app.get('/laporan', (req, res) => {
    res.render('laporan');
});


//--------- SATPAM -------//
app.get('/cekstatusptmt', (req, res) => {
    res.render('cekstatusptmt');
})


//---------- EXCEL ----------//
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    cb(null, __dirname + '/uploads/')
    },
    filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
    });
    const upload = multer({storage: storage});
    app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
    });
    app.post('/uploadfile', upload.single("uploadfile"), (req, res) =>{
    importExcelData2MySQL(__dirname + '/uploads/' + req.file.filename);
    console.log(res);
    });
    
    function importExcelData2MySQL(filePath){
    readXlsxFile(filePath).then((rows) => {
    console.log(rows);
    rows.shift();
    
    let query = 'INSERT INTO customer (id, address, name, age) VALUES ?';
    connection.query(query, [rows], (error, response) => {
    console.log(error || response);
    });
    });
    }