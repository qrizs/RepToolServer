const mariadb = require('mariadb');
const param = {};

const setParameters = (p) => {
    Object.assign(param ,p);
}

setParameters({
    host: 'localhost',
    user: 'root',
    password: 'sa',
    database: 'fraffe',
    port: 3306,
    compress: true,
    waitForConnections: true,
    multipleStatements: true,
    rowAsArray: true
});

/*
// fetchTableValue - retrieve data from datasource table using query parameter
// parameters:
//      query: (string) MariaDB query
//      callback: (function) used to process raw data
*/
const fetchTableValue = (query, callback) => {
    console.log("SQL POST STARTS!!!");
    const data = [];
    const pool = openConnection();
    try {
        pool.getConnection()
        .then(conn => {
            console.log("SQL OPENING!!!");
            conn.query(query)
                .then(rows => {
                    console.log("SQL LOADING DATA!!!");
                    data.push(rows);
                })
                .then(res => {
                    console.log("SQL CLOSING!!!");
                    callback(data);
                    conn.end();
                    closeConnection();
                    //pool.end();
                })
                .catch(err => {
                    console.log("SQL EXECUTE QUERY ERROR!!!", err);
                    conn.destroy();
                    closeConnection();
                });
        });
    }
    catch(error) {
        console.log("SQL FULL ERROR!!!", error);
    }

};


const fetchTableValue_old = (query, callback) => {
    console.log("SQL POST STARTS!!!");
    const data = [];
    const pool = openConnection();
    try {
        pool.getConnection()
        .then(conn => {
            console.log("SQL OPENING!!!");
            conn.query(query)
                .then(rows => {
                    console.log("SQL LOADING DATA!!!");
                    data.push(rows);
                })
                .then(res => {
                    console.log("SQL CLOSING!!!");
                    callback(data);
                    conn.end();
                    closeConnection();
                    //pool.end();
                })
                .catch(err => {
                    console.log("SQL EXECUTE QUERY ERROR!!!", err);
                    conn.destroy();
                    closeConnection();
                });
        });
    }
    catch(error) {
        console.log("SQL FULL ERROR!!!", error);
    }

};

const closeConnection = (pool, needsDestroy) => {
    if (pool != null) {
        if (!pool.closed) {
            if (needsDestroy) {
                pool.destroy();
            }
            else {
                pool.end();
            }
        }
    }   
};


const openConnection = () => {
    return pool = mariadb.createPool(param);  
};


module.exports = {
    fetchTableValue
}
