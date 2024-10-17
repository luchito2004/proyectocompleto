const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de la conexión a la base de datos
const config = {
    user: 'adminlu',
    password: 'Lucho12345',
    server: 'luchodb.database.windows.net',
    database: 'luchodb',
    options: {
        trustServerCertificate: false // No confíes automáticamente en el certificado del servidor
    },
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir el archivo HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// CRUD básico (Conexión a la base de datos)
sql.connect(config).then(pool => {
    console.log('Conectado a la base de datos');

    // Registrar usuario
    app.post('/register', async (req, res) => {
        const { email, password } = req.body;
        try {
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, password)
                .query('INSERT INTO usuarios (email, password) VALUES (@email, @password)');
            res.status(201).send('Usuario registrado exitosamente');
        } catch (err) {
            console.error('Error al registrar el usuario:', err);
            res.status(500).send('Error al registrar el usuario');
        }
    });

    // Login de usuario
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, password)
                .query('SELECT * FROM usuarios WHERE email = @email AND password = @password');
            if (result.recordset.length > 0) {
                res.send('Login exitoso');
            } else {
                res.send('Correo o contraseña incorrectos');
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            res.status(500).send('Error al iniciar sesión');
        }
    });

    // Ruta para el CRUD (redirección)
    app.get('/crud', (req, res) => {
        res.send('Bienvenido al CRUD de usuarios');
    });

    // Iniciar el servidor
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Error al conectar a la base de datos:', err);
});
