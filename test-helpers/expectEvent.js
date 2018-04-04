"use strict";

module.exports = async (transaction, event, params, message, transactionListener) => {
    let out;
    try {
        out = await transactionListener.listen(transaction, event, 3000);
        delete out.txHash;
    } catch (err) {
        assert.fail(message);
        return;
    }
        
    assert.deepEqual(out, params, message);
   
}