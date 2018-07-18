const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let TokenVault = artifacts.require('TokenVault');
let Senate = artifacts.require('Senate');

module.exports = async (deployer, network, accounts) => {
    let president = accounts[0];

    await deployer.deploy(
        Senate,
        president,
        conf.DEBATING_PERIOD_SECS,
        conf.QUORUM_FRACTION_MULTIPLIED,
        TokenVault.address
    );

}