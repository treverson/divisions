const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let DivisionsToken = artifacts.require('DivisionsToken');

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(DivisionsToken);
}