const fs = require('fs');

const ADDRESS_JSON_PATH = "addresses.json";

let DivisionsToken = artifacts.require('DivisionsToken');
let Exchange = artifacts.require('Exchange');

let StakeManager = artifacts.require('StakeManager');

const MIN_BUY_ORDER_AMOUNT = web3.toWei(0.01, 'ether');
const MIN_SELL_ORDER_AMOUNT = 0.01e18;

module.exports = async deployer => {
    
    try {
        let addressesP1 = JSON.parse(fs.readFileSync(ADDRESS_JSON_PATH));
    
        await deployer.deploy(DivisionsToken);
        await deployer.deploy(
            Exchange,
            DivisionsToken.address,
            addressesP1.stakeManager,
            MIN_BUY_ORDER_AMOUNT,
            MIN_SELL_ORDER_AMOUNT
        );

        let addresses = {
            exchange: Exchange.address,
            divisionsToken: DivisionsToken.address
        };
        Object.assign(addresses, addressesP1);
        let addressesJson = JSON.stringify(addresses);

        fs.writeFileSync(ADDRESS_JSON_PATH, addressesJson);
    } catch (err) {
        console.log(err);
    }
}