const fs = require('fs');

const ADDRESS_JSON_PATH_P1 = "addresses-p1.json";

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let StakeManager = artifacts.require('StakeManager');

const minDepositSize = web3.toWei(1, 'ether');
const epochLength = 20;
const epochsBeforeLogout = 10;

const dynastyLogoutDelay = 0;
const withdrawalDelay = 0;

const validator = web3.eth.accounts[1];

module.exports = async deployer => {
    try {
        await deployer.deploy(
            MockCasper,
            minDepositSize,
            epochLength,
            dynastyLogoutDelay,
            withdrawalDelay
        );

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
        fs.writeFileSync(ADDRESS_JSON_PATH_P1, addressesJson);
    } catch (err) {
        console.log(err);
    }

}