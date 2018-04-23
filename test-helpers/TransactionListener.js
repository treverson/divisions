const Timeout = require("./timeout");

function getEventCode(event) {
    let options = event.options;
    let topics = options.topics.join();
    let address = options.address;
    return address + topics;
}

const boundEvents = {};
const eventHandlers = {};

module.exports = class {
    
    listen(transaction, event, timeoutMs) {
        if(event) this.bind(event);
        if(!timeoutMs) timeoutMs = 5000;
        
        let p =  new Promise((resolve, reject) => {
            transaction.then((txHash) => {
                eventHandlers[txHash] = (args) => {
                    args.txHash = txHash;
                    
                    resolve(args);
                    delete eventHandlers[txHash];
                }
                
            });
        });

        return Promise.race([p, Timeout.reject(timeoutMs)]);
    }
    
    bind(event) {
        let code = getEventCode(event);
        if(!boundEvents[code]){
            boundEvents[code] = event;

            event.watch((err, res) => {
                if(eventHandlers[res.transactionHash]){
                    eventHandlers[res.transactionHash](res.args);
                }
            });
        }
    }

    dispose() {
        for(var code in boundEvents){
            if(!boundEvents.hasOwnProperty(code)) continue;
            boundEvents[code].stopWatching();
            delete boundEvents[code];
        }
    }
}