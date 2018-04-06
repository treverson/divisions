"use strict";

let TransactionListener = require('./TransactionListener');
let transactionListener = new TransactionListener();
module.exports = async (transaction, event, params, message) => {
    if(!message) message = "Event not logged with correct params";
    let out;
    try {
        out = await transactionListener.listen(transaction, event, 8000);
        
    } catch (err) {
        assert.fail(err.toString());
        transactionListener.dispose();
        return;
    }
    delete out.txHash;
    assert.deepEqual(out, params, message);
    transactionListener.dispose();
}