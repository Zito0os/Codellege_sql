CREATE DATABASE IF NOT EXISTS tienda_pepe;

USE tienda_pepe;

CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    dia_visita VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    cant_sugerida_reorden INT NOT NULL DEFAULT 10,
    proveedor_id INT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_venta DATETIME DEFAULT CURRENT_TIMESTAMP,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

INSERT INTO proveedores (id, nombre_empresa, contacto, telefono, dia_visita) VALUES
(1, 'Coca-Cola FEMSA', 'Juan Pérez', '8110001122', NULL),
(2, 'Sabritas / PepsiCo', 'María Gómez', '8119998877', NULL),
(3, 'Abarrotera Central', 'Carlos Ruíz', '8115554433', NULL);

INSERT INTO productos
(nombre, descripcion, precio, stock_actual, stock_minimo, cant_sugerida_reorden, proveedor_id)
VALUES
('Coca-Cola 600ml', 'Botella No Retornable', 18.00, 10, 24, 48, 1),
('Coca-Cola 2.5L', 'Botella Retornable', 38.00, 8, 12, 24, 1),
('Sprite 600ml', 'Sabor Lima-Limón', 17.00, 15, 12, 24, 1),
('Fanta Naranja 600ml', 'Refresco con gas', 17.00, 6, 12, 24, 1),
('Agua Ciel 1.5L', 'Agua purificada sin gas', 15.00, 5, 18, 36, 1),
('Agua Ciel 600ml', 'Agua purificada', 10.00, 20, 24, 48, 1),
('Jugo Del Valle Durazno 1L', 'Tetrapack', 28.00, 4, 10, 20, 1),
('Powerade Frutas 1L', 'Bebida rehidratante', 32.00, 12, 10, 20, 1),
('Fuze Tea Limón 600ml', 'Té negro sabor limón', 19.00, 7, 12, 24, 1),
('Monster Energy 473ml', 'Bebida energética', 45.00, 3, 6, 12, 1),

('Sabritas Sal 45g', 'Papas fritas clásicas', 22.00, 10, 20, 40, 2),
('Doritos Nacho 58g', 'Totopos de maíz sazonados', 20.00, 5, 20, 40, 2),
('Ruffles Queso 52g', 'Papas onduladas con queso', 22.00, 18, 15, 30, 2),
('Cheetos Torciditos 55g', 'Botana de maíz sabor queso', 16.00, 8, 15, 30, 2),
('Churrumais 105g', 'Fritura de maíz con chile y limón', 14.00, 25, 10, 20, 2),
('Paketaxo Quexo 215g', 'Mezcla de botanas saladas', 55.00, 4, 6, 12, 2),
('Galletas Chokis 76g', 'Galletas con chispas de chocolate', 18.00, 12, 10, 20, 2),
('Galletas Marias Gamesa 170g', 'Rollito de galletas tradicionales', 21.00, 14, 12, 24, 2),
('Emperador Chocolate 109g', 'Galletas rellenas', 20.00, 9, 12, 24, 2),
('Nuez de la India Mafer 50g', 'Nuez sazonada', 38.00, 2, 5, 10, 2),

('Aceite de Oliva 1L', 'Aceite extra virgen importado', 100.00, 4, 10, 15, 3),
('Café Soluble Nescafe 300g', 'Frasco de vidrio', 180.00, 2, 4, 8, 3),
('Sartén Antiadherente 24cm', 'Sartén de teflón básico', 100.00, 3, 10, 12, 3),
('Arroz Blanco Verde Valle 1kg', 'Bolsa grano entero', 34.00, 15, 12, 24, 3),
('Frijol Negro Isadora 430g', 'Pouch frijoles refritos', 21.00, 20, 15, 30, 3),
('Atún Herdez en Agua 130g', 'Lata de atún', 19.00, 30, 20, 40, 3),
('Leche Entera Lala 1L', 'UHT Tetrapack', 28.00, 6, 18, 36, 3),
('Detergente Ariel 1kg', 'Jabón en polvo multiacción', 48.00, 8, 10, 20, 3),
('Jabón Zote Blanco 400g', 'Jabón de lavandería', 25.00, 16, 12, 24, 3),
('Papel Higiénico Petalo 4 pzas', 'Paquete con 4 rollos', 32.00, 11, 10, 20, 3);

DELIMITER //

CREATE PROCEDURE sp_productos_crud(
    IN p_accion VARCHAR(20),
    IN p_id INT,
    IN p_nombre VARCHAR(100),
    IN p_descripcion TEXT,
    IN p_precio DECIMAL(10,2),
    IN p_stock_actual INT, -- Se usará como "cantidad a comprar" cuando p_accion = 'COMPRAR'
    IN p_stock_minimo INT,
    IN p_cant_sugerida_reorden INT,
    IN p_proveedor_id INT
)
BEGIN
    DECLARE v_stock_disponible INT;
    DECLARE v_precio_producto DECIMAL(10,2);
    DECLARE v_total_venta DECIMAL(10,2);

    IF UPPER(p_accion) = 'READ' THEN

        IF p_id IS NULL OR p_id = 0 THEN

            SELECT
                p.id,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock_actual,
                p.stock_minimo,
                p.cant_sugerida_reorden,
                p.proveedor_id,
                pr.nombre_empresa AS proveedor,
                CASE
                    WHEN p.stock_actual <= p.stock_minimo THEN 1
                    ELSE 0
                END AS stock_bajo
            FROM productos AS p
            LEFT JOIN proveedores AS pr
                ON p.proveedor_id = pr.id
            ORDER BY p.id;

        ELSE

            SELECT
                p.id,
                p.nombre,
                p.descripcion,
                p.precio,
                p.stock_actual,
                p.stock_minimo,
                p.cant_sugerida_reorden,
                p.proveedor_id,
                pr.nombre_empresa AS proveedor,
                CASE
                    WHEN p.stock_actual <= p.stock_minimo THEN 1
                    ELSE 0
                END AS stock_bajo
            FROM productos AS p
            LEFT JOIN proveedores AS pr
                ON p.proveedor_id = pr.id
            WHERE p.id = p_id;

        END IF;

    ELSEIF UPPER(p_accion) = 'CREATE' THEN

        INSERT INTO productos (
            nombre,
            descripcion,
            precio,
            stock_actual,
            stock_minimo,
            cant_sugerida_reorden,
            proveedor_id
        ) VALUES (
            p_nombre,
            p_descripcion,
            p_precio,
            p_stock_actual,
            p_stock_minimo,
            p_cant_sugerida_reorden,
            p_proveedor_id
        );

        SELECT
            'Producto creado correctamente' AS mensaje,
            LAST_INSERT_ID() AS id;

    ELSEIF UPPER(p_accion) = 'UPDATE' THEN

        IF NOT EXISTS (
            SELECT 1
            FROM productos
            WHERE id = p_id
        ) THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se encontro el producto para actualizar';

        ELSE

            UPDATE productos
            SET
                nombre = p_nombre,
                descripcion = p_descripcion,
                precio = p_precio,
                stock_actual = p_stock_actual,
                stock_minimo = p_stock_minimo,
                cant_sugerida_reorden = p_cant_sugerida_reorden,
                proveedor_id = p_proveedor_id
            WHERE id = p_id;

            SELECT
                'Producto actualizado correctamente' AS mensaje,
                p_id AS id;

        END IF;

    ELSEIF UPPER(p_accion) = 'DELETE' THEN

        IF NOT EXISTS (
            SELECT 1
            FROM productos
            WHERE id = p_id
        ) THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No se encontro el producto para eliminar';

        ELSE

            DELETE FROM productos
            WHERE id = p_id;

            SELECT
                'Producto eliminado correctamente' AS mensaje,
                p_id AS id;

        END IF;

    ELSEIF UPPER(p_accion) = 'ALTA_STOCK' THEN
        IF p_stock_actual IS NULL OR p_stock_actual <= 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cantidad de alta debe ser mayor que cero';
        ELSEIF NOT EXISTS (
            SELECT 1
            FROM productos
            WHERE id = p_id
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El producto no existe';
        ELSE
            UPDATE productos
            SET stock_actual = stock_actual + p_stock_actual
            WHERE id = p_id;

            SELECT
                'Alta de stock registrada con exito' AS mensaje,
                p_id AS producto_id,
                p_stock_actual AS cantidad_agregada;
        END IF;

    ELSEIF UPPER(p_accion) = 'COMPRAR' THEN
        SELECT stock_actual, precio 
        INTO v_stock_disponible, v_precio_producto
        FROM productos 
        WHERE id = p_id;

        IF v_stock_disponible IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El producto no existe';
        
        ELSEIF v_stock_disponible < p_stock_actual THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock insuficiente para realizar la compra';

        ELSE
            UPDATE productos
            SET stock_actual = stock_actual - p_stock_actual
            WHERE id = p_id;
            SET v_total_venta = p_stock_actual * IFNULL(p_precio, v_precio_producto);
            
            INSERT INTO ventas (producto_id, cantidad, precio_unitario, total)
            VALUES (p_id, p_stock_actual, IFNULL(p_precio, v_precio_producto), v_total_venta);

            SELECT 
                'Compra registrada con exito' AS mensaje,
                LAST_INSERT_ID() AS venta_id,
                p_id AS producto_id,
                (v_stock_disponible - p_stock_actual) AS nuevo_stock;

        END IF;

    ELSE

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Accion no valida. Use READ, CREATE, UPDATE, DELETE, ALTA_STOCK o COMPRAR';

    END IF;

END //

DELIMITER ;
