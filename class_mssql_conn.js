require("edge-js");
const oledb = require('oledb');


class SSASConn {
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

    openConnection() {
        if (this._param.database && this._param.server) {
            const connectionString = `Provider=MSOLAP;Data Source=${this._param.server};Initial Catalog=${this._param.database}`;
            _pool = oledb.oledbConnection(connectionString);
            return true;    
        }
        else {
            let error = (this._param.server ? "" : "Please indicate the server. ") & (this._param.database ? "" : "Please indicate the database.")
            return "Please indicate the server or database."
        }
    }

    closeConnection(p_needsDestroy) {
        return null; //not used
    }

    fetchTableValue(p_query, p_callback, p_manual = true) {
        this._pool.query(p_query)
            .then(result => {
                p_callback({
                    data: result.result[0],
                    status: "Success",
                    query: p_query
                });
            })
            .catch(err => {
                p_callback({
                    data: {},
                    status: "Error",
                    error: err.toString()
                });
            });
    }

}

module.exports = {
    SSASConn
}
