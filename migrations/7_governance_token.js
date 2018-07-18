const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let GovernanceToken = artifacts.require('GovernanceToken');

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(GovernanceToken, conf.GOV_TOKEN_INITIAL_SUPPLY);
}