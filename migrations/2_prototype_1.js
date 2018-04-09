const fs = require('fs');

const ADDRESS_JSON_PATH = "addresses-p1.json";

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let StakeManager = artifacts.require('StakeManager');

const minDepositSize = web3.toWei(1, 'ether');
const epochLength = 20;
const epochsBeforeLogout = 10;

const validator = web3.eth.accounts[1];

module.exports = async deployer => {
    try {
        await deployer.deploy(MockCasper, minDepositSize, epochLength);

        await deployer.deploy(Treasury, MockCasper.address);

        await deployer.deploy(
            StakeManager,
            MockCasper.address,
            validator,
            Treasury.address,
            epochsBeforeLogout
        );

        let addresses = {
            casper: MockCasper.address,
            treasury: Treasury.address,
            stakeManager: StakeManager.address
        };

        let addressesJson = JSON.stringify(addresses);
        fs.writeFileSync(ADDRESS_JSON_PATH, addressesJson);
    } catch (err) {
        console.log(err);
    }

}