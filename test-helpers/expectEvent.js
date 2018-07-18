"use strict";

module.exports = async function (transaction, event, params, message) {
    message = (message || "Event not logged with correct params");

    try {
        let txHash = (await transaction).tx;
        let events = await new Promise((resolve, reject) => {
            event.get((err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        let eventArgs;
        for (let event of events) {
            if (event.transactionHash == txHash) {
                eventArgs = event.args;
                break;
            }
        }
        if(!eventArgs)
            assert.fail("No event logged");

        for (var key in params) {
            if (params[key] === '@any' && eventArgs[key]) {
                delete params[key];
                delete eventArgs[key];
            }
        }
        if (params) {
            assert.deepEqual(eventArgs, params, message);
        }
        eventArgs.txHash = txHash;
        return eventArgs;
    } catch (err) {
    
        if (err.__proto__.toString() == "AssertionError") throw (err);
        else assert.fail("Error", err);
    }
}