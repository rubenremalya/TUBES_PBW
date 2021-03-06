const url = require ('url');

    const express = require('express')
    const app = express()
    const bodyparser = require('body-parser')
    const fs = require('fs');
    const readXlsxFile = require('read-excel-file/node');
    const mysql = require('mysql')
    const multer = require('multer')
    const path = require('path')
    const session = require('express-session')
    const pdf = require ('html-pdf');
    const ejs = require ('ejs');
    const bcrypt = require('bcrypt');
    const saltRounds = 10;

const PORT = 8080;

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

const getLogin = (conn, username, password) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT * FROM admin WHERE username_admin = '${username}' AND pass_admin = '${password}'`, (err, result) => {
            if(err){
                reject(err);
            }
            else{
                resolve(result);
            }
        })
    })
}

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

app.post('/auth', async function(req, res) {
	let username = req.body.username;
	let password = req.body.password;
    const conn = await dbConnect();
    const login = await getLogin(conn, username, password);

	if (username && password) {
		conn.query(`SELECT * FROM admin WHERE username_admin = '${username}' AND pass_admin = '${password}'`, 
        [username, password], function(error, results, fields) {
			if (error) throw error;
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
                req.session.nama = results[0].nama_admin;
                req.session.status = results[0].status;
                if(results[0].status == "admin"){
                    res.redirect('menu')
                }
                console.log(req.session)
			} 
            
            else if(username && password){
                connection.query(`SELECT * FROM siswa WHERE username_siswa = '${username}' AND pass_siswa = '${password}'`, 
                [username, password], function(error, results, fields) {
                    if (error) throw error;
                    if (results.length > 0) {
                        req.session.loggedin = true;
				        req.session.username = username;
                        req.session.nama = results[0].nama_siswa;
                        req.session.status = results[0].status;
                        if(results[0].status == "siswa"){
                        res.redirect('menusiswa')
                        }
                    } 
                    
                    else if(username && password){
                        connection.query('SELECT * FROM guru WHERE username_guru = ? AND pass_guru = ?', 
                        [username, password], function(error, results, fields) {
                            if (error) throw error;
                            if (results.length > 0) {
                                req.session.loggedin = true;
				                req.session.username = username;
                                req.session.nama = results[0].nama_guru;
                                req.session.status = results[0].status;
                                if(results[0].status == "guru"){
                                    res.redirect('menusiswa')
                                } 
                            }

                            else if(username && password){
                                connection.query('SELECT * FROM kepalasekolah WHERE username_kepsek = ? AND pass_kepsek = ?', 
                                [username, password], function(error, results, fields) {
                                    if (error) throw error;
                                    if (results.length > 0) {
                                        req.session.loggedin = true;
				                        req.session.username = username;
                                        req.session.nama = results[0].nama_kepsek;
                                        req.session.status = results[0].status;
                                        if(results[0].status == "kepsek"){
                                            res.redirect('menukepsek')
                                        }
                                    }

                                    else if(username && password){
                                        connection.query('SELECT * FROM satpam WHERE username_satpam = ? AND pass_satpam = ?', 
                                        [username, password], function(error, results, fields) {
                                            if (error) throw error;
                                            if (results.length > 0) {
                                                req.session.loggedin = true;
				                                req.session.username = username;
                                                req.session.nama = results[0].nama_satpam;
                                                req.session.status = results[0].status;
                                                if(results[0].status == "satpam"){
                                                    res.redirect('cekstatusptmt')
                                                }
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

const getPeriode = (conn, nama, status) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT nama_perioda FROM periode`, function(err, result){
            if(err){
                reject(err);
            }
            else{
                resolve(result);
            }
        })
    })
}

app.get('/menu', async(req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('menu', {
        nama
    });
});

const getRuang = (conn, nama, status) => {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id_ruang FROM ruang`, function(err, result){
            if(err){
                reject(err);
            }
            else{
                resolve(result);
            }
        })
    })
}

app.get('/periode', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    const resruang = await getRuang(conn);
    conn.release();
    res.render('periode', {
        nama, resruang
    });
});


app.post('/periode', function(req, res) {
    let comm = "INSERT INTO periode SET ?";
    let comm2 = "INSERT INTO ruang SET ?";
    let isi2 = {kapasitas_ruang: req.body.jumlah};
    let isi = {kapasitas: req.body.jumlah, nama_perioda: req.body.Fname, tanggal_mulai: req.body.mulai,
    tanggal_akhir: req.body.akhir, nama_perioda2: req.body.Fname2, tgl_mulaidaftar: req.body.Mdaftar, tgl_akhirdaftar: req.body.Adaftar};
	connection.query(comm2, isi2, function(error, results, fields) {
		if (error) throw error;
		});
    connection.query(comm, isi, function(error, results, fields) {
		if (error) throw error;
		res.redirect('/periode');
		res.end();
		});
});

const getDataMurid = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, NIS, username_siswa, pass_siswa FROM siswa', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/datamurid', async (req, res) => {
    const conn = await dbConnect();
    var resdata = await getDataMurid(conn);
    const nama = req.session.nama;
    conn.release();
    res.render('datamurid', {
        resdata, nama
    });
});

app.post('/murid', function(req, res){
    let comm = "DELETE siswa FROM siswa";
    connection.query(comm, function(error, results, fields) {
		if (error) throw error;
        res.redirect('datamurid');
		});
})
app.get('/dataGuru', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('dataguru', {
        nama
    });
});

app.post('/guru', async function(req, res) {
    const pass_guru = req.body.Fname;
    const pass_kepsek = req.body.email2;  
    const pass_satpam = req.body.email3;  
    const encryptedPassword1 = await bcrypt.hash(pass_guru, saltRounds);
    const encryptedPassword2 = await bcrypt.hash(pass_kepsek, saltRounds)
    const encryptedPassword3 = await bcrypt.hash(pass_satpam, saltRounds)
    let comm = "INSERT INTO guru SET ?";
    let comm2 = "INSERT INTO kepalasekolah SET ?";
    let comm3 = "INSERT INTO satpam SET ?";
    let isi = {NIP: req.body.Fname, nama_guru: req.body.Lname, username_guru: req.body.email, 
        pass_guru:encryptedPassword1, pelajaran: req.body.mapel, kelas: req.body.kelas};
    let isik = {nama_kepsek: req.body.Fname2, username_kepsek: req.body.Lname2, pass_kepsek:encryptedPassword2};    
    let isis = {nama_satpam: req.body.Fname3, username_satpam: req.body.Lname3, pass_satpam:encryptedPassword3}; 
    if(pass_guru){
        connection.query(comm, isi, function(error, results, fields) {
        if (error) throw error;
        res.redirect('/dataguru');
    });
    }
    else if(pass_kepsek){
        connection.query(comm2, isik, function(error, results, fields) {
        if (error) throw error;
        res.redirect('/dataguru');
    });
    }
    else if(pass_satpam){
        connection.query(comm3, isis, function(error, results, fields) {
        if (error) throw error;
        res.redirect('/dataguru');
        res.end();
    });    
    }
});
    

const getHadir = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, status_PTMT FROM siswa WHERE id_satpam = 1', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
    })
}

app.get('/daftarhadir', async function(req, res) {
    const conn = await dbConnect();
    var daftar = await getHadir(conn);
    const nama = req.session.nama;
    conn.release();
    connection.query('SELECT NIS FROM siswa ORDER BY id_satpam', function(err, rows) {
    res.render('daftarhadir', {
    data: rows, daftar, nama
    });
    

    connection.query('SELECT nama_perioda FROM periode ORDER BY id_periode desc',
    function(err, rows) {
        res.render('daftarhadir', {
            data: rows, daftar, nama
            });
            });
        });
    });


//--------- SISWA -------
app.get('/menusiswa', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('menusiswa' , {
        nama
    });
})

app.get('/datasiswa', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('datasiswa' , {
        nama
    });
})

app.post('/siswa', function(req, res) {

		connection.query("UPDATE siswa SET vaksin_ke = 'vaksin_ke: req.body.perioda' WHERE id_satpam = '1'", function(error, results, fields) {
			if (error) throw error;
			res.redirect('/statusptmt');
			res.end();
		});
});

app.get('/dataperiode', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('dataperiode' , {
        nama
    });
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

app.get('/statusptmt', async function(req, res) {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    var rest = await getStatusptmt(conn);
    conn.release();
    
    connection.query('SELECT nama_perioda FROM periode ORDER BY id_periode desc', function(err, rows) {
        res.render('statusptmt', {
            rest,
            data: rows,
            nama
    });
    });
    });


//--------- GURU -------
app.get('/menuguru', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('menuguru' , {
        nama
    });
})

const getInfoguru = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT NIP, nama_guru, pelajaran, kelas FROM guru', (err, result) => {
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
    const nama = req.session.nama
    conn.release();
    res.render('infoguru', {
        resinfo,
        nama
    });
});

const getDaftarsiswa = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, NIS, status_PTMT, periode, kelas FROM siswa', (err, result) => {
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
    const nama = req.session.nama
    var resdaft = await getDaftarsiswa(conn);
    var resper = await getPeriode(conn);
    conn.release();
    res.render('daftarsiswa', {
        resdaft, resper,
        nama
    });
});



//--------- KEPSEK -------
app.get('/menukepsek', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('menukepsek' , {
        nama
    });
})

app.get('/grafiktrendptmt', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('grafiktrendptmt' , {
        nama
    });
})
app.get('/grafiktrendptmt2', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('grafiktrendptmt2' , {
        nama
    });
});
app.get('/grafiktrendptmt3', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama;
    conn.release();
    res.render('grafiktrendptmt3' , {
        nama
    });
});
const getLaporan = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_guru, pelajaran FROM guru', (err, result) => {
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
    const nama = req.session.nama
    var reslap = await getLaporan(conn);
    conn.release();
    res.render('laporan', {
        reslap,
        nama
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
const getSatpam = conn => {
    return new Promise((resolve, reject) => {
        conn.query('SELECT nama_siswa, status_PTMT FROM siswa WHERE id_satpam = 1', (err, result) => {
            if(err) {
                reject(err);
            } else{
                resolve(result);
            }
        })
})
}

app.get('/cekstatusptmt', async (req, res) => {
    const conn = await dbConnect();
    const nama = req.session.nama
    var satpam = await getSatpam(conn);
    conn.release();
    connection.query('SELECT NIS FROM siswa ORDER BY id_satpam desc', function(err, rows) {
        res.render('cekstatusptmt', {
        data: rows, satpam,
        nama
        });
        });     
});


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
    res.redirect('datamurid');
    });
    
    function importExcelData2MySQL(filePath){
    readXlsxFile(filePath).then((rows) => {
    console.log(rows);
    rows.shift();
    
    let query = 'INSERT INTO siswa (NIS, pass_siswa, username_siswa, id_satpam, id_ruang, nama_siswa, status_PTMT, bukti_vaksin, tanggal_vaksin, vaksin_ke, email_ortu, nama_ortu, kelas, periode, status) VALUES ?';
    connection.query(query, [rows], (error, response) => {
    console.log(error || response);
    });
    });
    }

    var obj = {};

app.listen(PORT, () => {
    console.log(`Server is ready, listening on port ${PORT}`);
});