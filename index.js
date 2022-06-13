import * as url from 'url';
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import path from 'path';
import express from 'express';
import mysql from 'mysql';
import session from 'express-session';
import multer from 'multer';
import readXlsxFile from 'read-excel-file';
import bodyParser from 'body-parser';
import fs from 'fs';
import pdf from 'html-pdf';
import ejs from 'ejs';

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

const connection = mysql.createPool({
    user: 'root',
    password: '',
    database: 'dtbs_ptmt',
    host: 'localhost',
    connectionLimit: 10
});

const dbConnect = () => {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if(err) {
                reject(err);
            } else{
                resolve(conn);
            }
        })
    })
}


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
		connection.query('SELECT * FROM admin WHERE username_admin = ? AND pass_admin = ?', 
        [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/menu');
			} 
            
            else if(username && password){
                connection.query('SELECT * FROM siswa WHERE username_siswa = ? AND pass_siswa = ?', 
                [username, password], function(error, results, fields) {
                    if (error) throw error;
                    if (results.length > 0) {
                        req.session.loggedin = true;
                        req.session.username = username;
                        res.redirect('/menusiswa');
                    } 
                    
                    else if(username && password){
                        connection.query('SELECT * FROM guru WHERE username_guru = ? AND pass_guru = ?', 
                        [username, password], function(error, results, fields) {
                            if (error) throw error;
                            if (results.length > 0) {
                                req.session.loggedin = true;
                                req.session.username = username;
                                res.redirect('/menuguru');
                            } 

                            else if(username && password){
                                connection.query('SELECT * FROM kepalasekolah WHERE username_kepsek = ? AND pass_kepsek = ?', 
                                [username, password], function(error, results, fields) {
                                    if (error) throw error;
                                    if (results.length > 0) {
                                        req.session.loggedin = true;
                                        req.session.username = username;
                                        res.redirect('/menukepsek');
                                    }

                                    else if(username && password){
                                        connection.query('SELECT * FROM satpam WHERE username_satpam = ? AND pass_satpam = ?', 
                                        [username, password], function(error, results, fields) {
                                            if (error) throw error;
                                            if (results.length > 0) {
                                                req.session.loggedin = true;
                                                req.session.username = username;
                                                res.redirect('/cekstatusptmt');
                                    }
                                        else {
                                            res.redirect('/incorrect');
                                        }			
                                        res.end();
                            
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
            
	});
}
	
    else{res.redirect('/');
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

app.post('/guru', function(req, res) {
    let comm = "INSERT INTO guru SET ?";
    let isi = {NIP: req.body.Fname, nama_guru: req.body.Lname, username_guru: req.body.email, 
        pass_guru: req.body.Fname, kelas: req.body.kelas};
		connection.query(comm, isi, function(error, results, fields) {
			if (error) throw error;
			res.redirect('/dataguru');
			res.end();
		});
});

const getHadir = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT NIS FROM siswa', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
    })
}

app.get('/daftarhadir', async (req, res) => {
    const conn = await dbConnect();
    const reshadir = await getHadir(conn);
    conn.release();
    console.log(reshadir);

    res.render('daftarhadir', {
        reshadir
    });
});


//--------- SISWA -------
app.get('/menusiswa', (req, res) => {
    res.render('menusiswa');
})

app.get('/datasiswa', (req, res) => {
    res.render('datasiswa');
})

app.post('/siswa', function(req, res) {
    let comm = "UPDATE siswa SET id_satpam=(SELECT id_satpam FROM siswa WHERE vaksin_ke LIKE '2')";
    let isi = {vaksin_ke: req.body.vaksin};
		connection.query(comm, isi, function(error, results, fields) {
			if (error) throw error;
			res.redirect('/dataguru');
			res.end();
		});
});

app.get('/dataperiode', (req, res) => {
    res.render('dataperiode');
})

const getStatusptmt = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_perioda, tanggal_mulai, tanggal_akhir FROM periode', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
    })
}

app.get('/statusptmt', async (req, res) => {
    const conn = await dbConnect();
    const resstat = await getStatusptmt(conn);
    conn.release();
    console.log(resstat);

    res.render('statusptmt', {
        resstat
    });
});

//--------- GURU -------
app.get('/menuguru', (req, res) => {
    res.render('menuguru');
})

const getInfoguru = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT NIP, nama_guru, kelas FROM guru', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/infoguru', async (req, res) => {
    const conn = await dbConnect();
    var resinfo = await getInfoguru(conn);
    conn.release();
    res.render('infoguru', {
        resinfo
    });
});

const getDaftarsiswa = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, NIS, status_PTMT, id_ruang FROM siswa', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/daftarsiswa', async (req, res) => {
    const conn = await dbConnect();
    var resinfo = await getDaftarsiswa(conn);
    conn.release();
    res.render('daftarsiswa', {
        resinfo
    });
});



//--------- KEPSEK -------
app.get('/menukepsek', (req, res) => {
    res.render('menukepsek');
})

app.get('/grafiktrendptmt', (req, res) => {
    res.render('grafiktrendptmt');
})

const getLaporan = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_guru FROM guru', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/laporan', async (req, res) => {
    const conn = await dbConnect();
    var reslap = await getLaporan(conn);
    conn.release();
    res.render('laporan', {
        reslap
    });
});

app.post("/generateReport", (req, res) => {
    ejs.renderFile(path.join(__dirname, '/views/Kepsek/laporan.ejs/'), (err, data) => {
    if (err) {
          res.send(err);
    } else {
        let options = {
            "height": "11.25in",
            "width": "8.5in",
            "header": {
                "height": "20mm"
            },
            "footer": {
                "height": "20mm",
            },
        };
        pdf.create(data, options).toFile("report.pdf", function (err, data) {
            if (err) {
                res.send(err);
            } else {
                res.send("File created successfully");
            }
        });
    }
});
})


//--------- SATPAM -------//
app.get('/cekstatusptmt', (req, res) => {
    res.render('cekstatusptmt');
})


//---------- EXCEL ----------//
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
    cb(null, __dirname + '/public/uploads/')
    },
    filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
    }
    });
    const upload = multer({storage: storage});
    app.get('/', (req, res) => {
    res.sendFile(__dirname + '/datamurid.ejs');
    });
    app.post('/uploadfile', upload.single("uploadfile"), (req, res) =>{
    importExcelData2MySQL(__dirname + '/public/uploads/' + req.file.filename);
    console.log(res);
    });
    
    function importExcelData2MySQL(filePath){
    readXlsxFile(filePath).then((rows) => {
    console.log(rows);
    rows.shift();
    
    let query = 'INSERT INTO siswa (NIS pass_siswa username_siswa id_satpam id_ruang nama_siswa status_PTMT bukti_vaksin tanggal_vaksin vaksin_ke email_ortu nama_ortu) VALUES ?';
    connection.query(query, [rows], (error, response) => {
    console.log(error || response);
    });
    });
    }

    var obj = {};
    


    app.get('/', function(req, res) {
        db.query('SELECT * FROM countries ORDER BY id desc', function(err, rows) {
        res.render('index', {
        data: rows
        });
        });
        });
        app.post('/get-states-by-country', function(req, res) {
        db.query('SELECT * FROM states WHERE country_id = "' + req.body.country_id + '"',
        function(err, rows, fields) {
        if (err) {
        res.json({
        msg: 'error'
        });
        } else {
        res.json({
        msg: 'success',
        states: rows
        });
        }
        });
        });
        app.post('/get-cities-by-state', function(req, res) {
        db.query('SELECT * FROM cities WHERE state_id = "' + req.body.state_id + '"',
        function(err, rows, fields) {
        if (err) {
        res.json({
        msg: 'error'
        });
        } else {
        res.json({
        msg: 'success',
        cities: rows
        });
        }
        });
        });



app.listen(PORT, () => {
    console.log(`Server is ready, listening on port ${PORT}`);
});