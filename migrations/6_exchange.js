const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let DivisionsToken = artifacts.require('DivisionsToken');
let StakeManager = artifacts.require('StakeManager');
let Exchange = artifacts.require('Exchange');

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(
        Exchange,
        DivisionsToken.address,
        StakeManager.address,
        conf.MIN_BUY_ORDER_AMOUNT,
        conf.MIN_SELL_ORDER_AMOUNT
    );
}