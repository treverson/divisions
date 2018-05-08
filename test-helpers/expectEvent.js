"use strict";

let TransactionListener = require('./TransactionListener');
let transactionListener = new TransactionListener();
module.exports = async (transaction, event, params, message) => {
    if (!message) message = "Event not logged with correct params";
    let out, temp;
    try {
        out = await transactionListener.listen(transaction, event, 8000);
        temp = out;
        delete temp.txHash;
        if (params) {

            for (var key in params) {
                if (params[key] === '@any' && temp[key]) {
                    delete params[key];
                    deletetempout[key];
                }
            }

            assert.deepEqual(temp, params, message);
        }
    } catch (err) {
    
        assert.fail(err.toString());
    } finally {
        transactionListener.dispose();
        return out;
    }
}