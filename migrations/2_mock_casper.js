const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let MockCasper = artifacts.require('MockCasper');

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(
        MockCasper,
        conf.MIN_DEPOSIT_SIZE,
        conf.EPOCH_LENGTH,
        conf.DYNASTY_LOGOUT_DELAY,
        conf.WITHDRAWAL_DELAY
    );
}