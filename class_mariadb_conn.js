const mariadb = require('mariadb');
require("dotenv").config();

class MariaDBConn {
    _param = {};
    _pool;

    constructor(p_param) {
        this._param = p_param;
    }

    get parameters() {
        return this._param;
    }

    set parameters(p_param) {
        this._param = p_param;
    }

    setParameter(p_key, p_value) {
        this._param[p_key] = p_value;
    }

    clone() {
        return new MariaDBConn(this._param);
    }

    openConnection() {
        console.log("Running openConnection.");
        try {
            this._pool = mariadb.createPool(this._param);
            return true;
        }
        catch (error) {
            return "Error on creating a pool. " & error.toString();
        }
    };    

    closeConnection(p_needsDestroy) {
        console.log("Running closeConnection.");
        try{
            if (this._pool != null) {
                if (!this._pool.closed) {
                    if (p_needsDestroy) {
                        console.log("Destroy pool.");
                        this._pool.destroy();
                    }
                    else {
                        console.log("End pool.");
                        this._pool.end();
                    }
                }
            }   
            return true;    
        }
        catch (error) {
            return "Error closing the pool. " & error.toString();
        }
    };

    fetchTableValue(p_query, p_callback, p_manual = true) {
        console.log("SQL POST STARTS!!!");
        const data = [];

        //const pool = openConnection();
        try {
            console.log("SQL POOL OPENING");
            if (p_manual) {
                this.openConnection();
            }
            this._pool.getConnection((err, connection) => {
                if (err) {
                    console.log(`SQL trying to connect to the database ${this._param.database}!`);
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
                        //console.log('data',data);
                        p_callback({
                            data:data,
                            status: "Success",
                            query: p_query
                        });
                        //closeConnection();
                        //pool.end();
                        console.log("SQL POOL CLOSING");
                        if (p_manual) {
                            this.closeConnection(false);
                        }
                    })
                    .catch(err => {
                        console.log("SQL EXECUTE QUERY ERROR!!!", err);
                        conn.release();
                        //this._pool.release();
                        //conn.destroy();
                        this.closeConnection(false);
                        p_callback({
                            data: {},
                            status: "Error",
                            error: err.toString()
                        });
                    });
            });

        }
        catch(error) {
            console.log("SQL FULL ERROR!!!");
            console.log('pool', this._pool);
            if (this._pool) {
                if (p_manual) {
                    this.closeConnection(false);
                }
            }
            p_callback({
                data: {},
                error: error.toString()
            });
        }
    
    };

};

module.exports = {
    MariaDBConn
}
