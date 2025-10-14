//Sección MySQL del código
const mySql = require("mysql2/promise");

/**
 * Objeto con la configuración de la base de datos MySQL a utilizar.
 */
const SQL_CONFIGURATION_DATA =
{
	host: process.env.MYSQL_HOST,
	user: process.env.MYSQL_USERNAME,
	password: process.env.MYSQL_PASSWORD, 
	database: process.env.MYSQL_DB,	
	port: 3306,
	charset: 'UTF-8'
}

exports.realizarQuery = async function (query, params = []) {
	const [rows] = await connection.execute(query, params);
	return rows;
}

/**
 * Realiza u.
 * @returns Respuesta de la base de datos. Suele ser un vectna query a la base de datos MySQL indicada en el archivo "mysql.js".
 * @param {String} queryString Query que se desea realizar. Textual como se utilizaría en el MySQL Workbenchor de objetos.
 */
exports.realizarQuery = async function (queryString)
{
    let returnObject = [];
	let connection;
	try
	{
		connection = await mySql.createConnection(SQL_CONFIGURATION_DATA);
		const result = await connection.execute(queryString);
		returnObject = result[0]; 
	}
	catch(err)
	{
		console.log("Error en la consulta SQL:", err);
		return [];
	}
	finally
	{
		if(connection && connection.end) connection.end();
	}
	return returnObject;
}


