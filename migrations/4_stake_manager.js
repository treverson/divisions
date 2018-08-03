const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let StakeManager = artifacts.require('StakeManager');

module.exports = async (deployer, network, accounts) => {
    let validator = accounts[0];

    await deployer.deploy(
        StakeManager,
        MockCasper.address,
        validator,
        Treasury.address,
        accounts[0]
    );
}