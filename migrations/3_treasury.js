const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');

module.exports = async (deployer, network, accounts) => {
    await deployer.deploy(Treasury, MockCasper.address);
}