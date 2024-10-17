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
        trustServerCertificate: false,
    },
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir el archivo HTML principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Conectar a la base de datos
sql.connect(config).then(pool => {
    console.log('Conectado a la base de datos');

    // Registro de usuarios
    app.post('/register', async (req, res) => {
        const { email, password } = req.body;
        try {
            const existingUser = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM usuarios WHERE email = @email');
            if (existingUser.recordset.length > 0) {
                return res.status(400).send('El correo ya está en uso');
            }
            await pool.request()
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, password)
                .query('INSERT INTO usuarios (email, password) VALUES (@email, @password)');
            res.status(201).send('Usuario registrado exitosamente');
        } catch (err) {
            console.error('Error al registrar usuario:', err);
            res.status(500).send('Error al registrar usuario');
        }
    });

    // Login de usuarios
    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, password)
                .query('SELECT * FROM usuarios WHERE email = @email AND password = @password');
            if (result.recordset.length > 0) {
                const usuarioId = result.recordset[0].id; // Asegúrate de que el id esté disponible
                res.json({ message: 'Login exitoso', usuarioId }); // Devuelve el usuarioID si lo necesitas
            } else {
                res.status(401).json({ message: 'Credenciales inválidas' });
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            res.status(500).send('Error al iniciar sesión');
        }
    });

    // Obtener productos
    app.get('/productos', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM productos');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener productos:', err);
            res.status(500).send('Error al obtener productos');
        }
    });

    // Manejar la finalización de compras aquí según lo que necesites
    app.post('/comprar', (req, res) => {
        // Implementar lógica para finalizar la compra
        res.send('Compra finalizada');
    });

    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Error al conectar a la base de datos:', err);
});
