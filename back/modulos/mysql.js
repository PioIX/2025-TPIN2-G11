const mySql = require("mysql2/promise");

const SQL_CONFIGURATION_DATA = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: 3306,
    charset: 'utf8'
}

exports.realizarQuery = async function (queryString, params = []) {
    let returnObject = [];
    let connection;
    
    try {
        connection = await mySql.createConnection(SQL_CONFIGURATION_DATA);
        
        if (params.length > 0) {
            const [result] = await connection.execute(queryString, params);
            returnObject = result;
        } else {
            const [result] = await connection.execute(queryString);
            returnObject = result;
        }
    } catch(err) {
        console.log("Error en la consulta SQL:", err);
        throw err; 
    } finally {
        if(connection && connection.end) await connection.end();
    }
    
    return returnObject;
}

console.log("🧩 Conectando a:", process.env.MYSQL_HOST, process.env.MYSQL_DB);