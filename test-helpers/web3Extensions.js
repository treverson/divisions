"use strict";

let TransactionListener = require("./TransactionListener");

    module.exports = {
        init: (web3) => {
            web3.txListener = new TransactionListener();
            
            web3.eth.getTransactionCosts = async (txHash) => {
                let tx = await web3.eth.getTransaction(txHash);
                
                let gasUsed = tx.gas;
                let gasPrice = tx.gasPrice;
                
                return gasPrice.times(gasUsed);
            }
    }
}