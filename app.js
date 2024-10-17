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
                res.json({ message: 'Login exitoso', usuarioId }); // Devuelve el usuarioId al frontend
            } else {
                res.status(401).send('Correo o contraseña incorrectos');
            }
        } catch (err) {
            console.error('Error al iniciar sesión:', err);
            res.status(500).send('Error al iniciar sesión');
        }
    });

    // CRUD de productos
    app.post('/productos', async (req, res) => {
        const { nombre, descripcion, precio } = req.body;
        try {
            await pool.request()
                .input('nombre', sql.VarChar, nombre)
                .input('descripcion', sql.VarChar, descripcion)
                .input('precio', sql.Decimal, precio)
                .query('INSERT INTO productos (nombre, descripcion, precio) VALUES (@nombre, @descripcion, @precio)');
            res.status(201).send('Producto agregado exitosamente');
        } catch (err) {
            console.error('Error al agregar producto:', err);
            res.status(500).send('Error al agregar producto');
        }
    });

    app.get('/productos', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM productos');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener productos:', err);
            res.status(500).send('Error al obtener productos');
        }
    });

    app.put('/productos/:id', async (req, res) => {
        const { id } = req.params;
        const { nombre, descripcion, precio } = req.body;
        try {
            await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.VarChar, nombre)
                .input('descripcion', sql.VarChar, descripcion)
                .input('precio', sql.Decimal, precio)
                .query('UPDATE productos SET nombre = @nombre, descripcion = @descripcion, precio = @precio WHERE id = @id');
            res.send('Producto actualizado exitosamente');
        } catch (err) {
            console.error('Error al actualizar producto:', err);
            res.status(500).send('Error al actualizar producto');
        }
    });

    app.delete('/productos/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM productos WHERE id = @id');
            res.send('Producto eliminado exitosamente');
        } catch (err) {
            console.error('Error al eliminar producto:', err);
            res.status(500).send('Error al eliminar producto');
        }
    });

    // CRUD del carrito
    app.post('/carrito', async (req, res) => {
        const { usuarioId, productoId, cantidad } = req.body;
        try {
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('productoId', sql.Int, productoId)
                .input('cantidad', sql.Int, cantidad)
                .query('INSERT INTO carrito (usuarioId, productoId, cantidad) VALUES (@usuarioId, @productoId, @cantidad)');
            res.status(201).send('Producto agregado al carrito');
        } catch (err) {
            console.error('Error al agregar al carrito:', err);
            res.status(500).send('Error al agregar al carrito');
        }
    });

    app.get('/carrito/:usuarioId', async (req, res) => {
        const { usuarioId } = req.params;
        try {
            const result = await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .query('SELECT * FROM carrito WHERE usuarioId = @usuarioId');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener el carrito:', err);
            res.status(500).send('Error al obtener el carrito');
        }
    });

    app.put('/carrito/:usuarioId/:productoId', async (req, res) => {
        const { usuarioId, productoId } = req.params;
        const { cantidad } = req.body;
        try {
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('productoId', sql.Int, productoId)
                .input('cantidad', sql.Int, cantidad)
                .query('UPDATE carrito SET cantidad = @cantidad WHERE usuarioId = @usuarioId AND productoId = @productoId');
            res.send('Carrito actualizado');
        } catch (err) {
            console.error('Error al actualizar carrito:', err);
            res.status(500).send('Error al actualizar carrito');
        }
    });

    app.delete('/carrito/:usuarioId/:productoId', async (req, res) => {
        const { usuarioId, productoId } = req.params;
        try {
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .input('productoId', sql.Int, productoId)
                .query('DELETE FROM carrito WHERE usuarioId = @usuarioId AND productoId = @productoId');
            res.send('Producto eliminado del carrito');
        } catch (err) {
            console.error('Error al eliminar producto del carrito:', err);
            res.status(500).send('Error al eliminar producto del carrito');
        }
    });

    // Finalizar compra
    app.post('/finalize-purchase', async (req, res) => {
        const { usuarioId } = req.body; // Asegúrate de enviar el usuarioId desde el frontend
        try {
            await pool.request()
                .input('usuarioId', sql.Int, usuarioId)
                .query('DELETE FROM carrito WHERE usuarioId = @usuarioId');
            res.send('Compra finalizada exitosamente');
        } catch (err) {
            console.error('Error al finalizar la compra:', err);
            res.status(500).send('Error al finalizar la compra');
        }
    });

    // Iniciar el servidor
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

}).catch(err => {
    console.error('Error al conectar a la base de datos:', err);
});
