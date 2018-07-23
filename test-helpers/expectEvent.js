"use strict";
module.exports = async function (transaction, event, params, message) {
    message = (message || "Event not logged with correct params");

    try {
        // Get the transaction hash, to compare logged events with later
        let receipt = await transaction;
        let txHash = receipt.tx;
        
        // Filter out any params with value '@any'
        let tempparams = Object.assign({}, params);
        for (var key in tempparams)
            if (tempparams[key] === '@any')
                delete tempparams[key]

        // Get all events that were logged with args ^= tempparams
        let events = await new Promise((resolve, reject) => {
            event().get((err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        // Get the arguments of the event that was logged in the transaction
        let eventArgs;
        for (let event of events) {
            if (event.transactionHash == txHash) {
                eventArgs = event.args;
                break;
            }
        }
        // If no event was logged
        if (!eventArgs)
            assert.fail(new Error("No event logged"));
        
        
        let tempEventArgs = Object.assign({}, eventArgs);
        for (var key in params) {
            if (params[key] === '@any' && tempEventArgs[key]) {
                delete params[key];
                delete tempEventArgs[key];
            }
        }
        if (params) {
            assert.deepEqual(tempEventArgs, params, message);
        }
        eventArgs.txHash = txHash;
        return eventArgs;
    } catch (err) {

        if (err.__proto__.toString() == "AssertionError") throw (err);
        else assert.fail("Error", err);
    }
}