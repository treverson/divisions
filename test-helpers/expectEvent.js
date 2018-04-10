"use strict";

let TransactionListener = require('./TransactionListener');
let transactionListener = new TransactionListener();
module.exports = async (transaction, event, params, message) => {
    if (!message) message = "Event not logged with correct params";
    let out;
    try {
        out = await transactionListener.listen(transaction, event, 8000);

        delete out.txHash;

        for (var key in params) {
            if (params[key] === '@any' && out[key]) {
                delete params[key];
                delete out[key];
            }
        }

        assert.deepEqual(out, params, message);

    } catch (err) {
        assert.fail(err.toString());
    } finally {
        transactionListener.dispose();
    }
}