const fs = require('fs');

const ADDRESS_JSON_PATH = "addresses.json";

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let StakeManager = artifacts.require('StakeManager');

let DivisionsToken = artifacts.require('DivisionsToken');
let Exchange = artifacts.require('Exchange');

let GovernanceToken = artifacts.require('GovernanceToken');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;

const DYNASTY_LOGOUT_DELAY = 0;
const WITHDRAWAL_DELAY = 0;

const MIN_BUY_ORDER_AMOUNT = web3.toWei(0.01, 'ether');
const MIN_SELL_ORDER_AMOUNT = 0.01e18;

const GOV_TOKEN_INITIAL_SUPPLY = 1000e18;

const validator = web3.eth.accounts[1];
module.exports = async deployer => {
    
    try {
        await deployer.deploy(
            MockCasper,
            MIN_DEPOSIT_SIZE,
            EPOCH_LENGTH,
            DYNASTY_LOGOUT_DELAY,
            WITHDRAWAL_DELAY
        );

        await deployer.deploy(Treasury, MockCasper.address);

        await deployer.deploy(
            StakeManager,
            MockCasper.address,
            validator,
            Treasury.address
        );

        await deployer.deploy(
            DivisionsToken
        );

        await deployer.deploy(
            Exchange,
            DivisionsToken.address,
            StakeManager.address,
            MIN_BUY_ORDER_AMOUNT,
            MIN_SELL_ORDER_AMOUNT
        );

        await deployer.deploy(GovernanceToken, GOV_TOKEN_INITIAL_SUPPLY);

        let deployedTreasury = Treasury.at(Treasury.address);
        await deployedTreasury.setStakeManager(StakeManager.address);
        await deployedTreasury.setExchange(Exchange.address);
        
        let deployedDivToken = DivisionsToken.at(DivisionsToken.address);
        await deployedDivToken.transferMintership(Exchange.address);

        let addresses = {
            casper: MockCasper.address,
            treasury: Treasury.address,
            stakeManager: StakeManager.address,
            divisionToken: DivisionsToken.address,
            exchange: Exchange.address,
            governanceToken: GovernanceToken.address
        };
        
        let addressesJson = JSON.stringify(addresses);
        fs.writeFileSync(ADDRESS_JSON_PATH, addressesJson);
    } catch (err) {
        console.log(err);
    }

}