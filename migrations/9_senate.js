const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let TokenVault = artifacts.require('TokenVault');
let DelegatingSenate = artifacts.require('DelegatingSenate');

module.exports = async (deployer, network, accounts) => {
    let president = accounts[0];

    await deployer.deploy(
        DelegatingSenate,
        president,
        conf.DEBATING_PERIOD_BLOCKS,
        conf.QUORUM_FRACTION_MULTIPLIED,
        TokenVault.address
    );

}