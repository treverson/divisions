const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let GovernanceToken = artifacts.require('GovernanceToken');
let TokenVault = artifacts.require('TokenVault');

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(TokenVault, accounts[0], GovernanceToken.address);

}