const mariadb = require('mariadb');
require("dotenv").config();

class MariaDBConn {
    _param = {};
    _pool;

    constructor(p_param) {
        this._param = p_param;
        this._pool = mariadb.createPool(this._param);
    }

    get parameters() {
        return this._param;
    }

    openConnection() {
        this._pool.getConnection((err, conn) => {
            if (err) {
                this._pool = mariadb.createPool(this._param);
            }
        });
    };    

    closeConnection(p_needsDestroy) {
        if (this._pool != null) {
            if (!this._pool.closed) {
                if (p_needsDestroy) {
                    this._pool.destroy();
                }
                else {
                    this._pool.end();
                }
            }
        }   
    };

    fetchTableValue(p_query, p_callback) {
        console.log("SQL POST STARTS!!!");
        const data = [];

        //const pool = openConnection();
        try {
            this._pool.getConnection((err, connection) => {
                if (err) {
                    console.log("SQL couldn't connect to the database!");
                    openConnection();
                    fetchTableValue(p_query, p_callback);
                }
            })
            .then(conn => {
                console.log("SQL OPENING!!!");
                conn.query(p_query)
                    .then(rows => {
                        console.log("SQL LOADING DATA!!!");
                        data.push(rows);
                    })
                    .then(res => {
                        console.log("SQL CLOSING!!!",res);
                        
                        conn.release();
                        //this._pool.release();
                        //conn.end();
                        p_callback(data);
                        //closeConnection();
                        //pool.end();
                    })
                    .catch(err => {
                        console.log("SQL EXECUTE QUERY ERROR!!!", err);
                        conn.release();
                        //this._pool.release();
                        //conn.destroy();
                        //closeConnection();
                    });
            });
        }
        catch(error) {
            console.log("SQL FULL ERROR!!!", error);
        }
    
    };

};

module.exports = {
    MariaDBConn
}