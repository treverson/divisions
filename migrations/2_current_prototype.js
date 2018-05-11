const fs = require('fs');

const ADDRESS_JSON_PATH = "addresses.json";

let AddressBook = artifacts.require('AddressBook');

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let StakeManager = artifacts.require('StakeManager');

let DivisionsToken = artifacts.require('DivisionsToken');
let Exchange = artifacts.require('Exchange');

let GovernanceToken = artifacts.require('GovernanceToken');
let TokenVault = artifacts.require('TokenVault');
let Senate = artifacts.require('Senate');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;

const DYNASTY_LOGOUT_DELAY = 0;
const WITHDRAWAL_DELAY = 0;

const MIN_BUY_ORDER_AMOUNT = web3.toWei(0.01, 'ether');
const MIN_SELL_ORDER_AMOUNT = 0.01e18;

const GOV_TOKEN_INITIAL_SUPPLY = 1000e18;

const DEBATING_PERIOD_SECS = 20;
const QUORUM_FRACTION_MULTIPLIED = 0.5e18;

const GOVERNANCE_TOKEN_NAME = "GovernanceToken";

const validator = web3.eth.accounts[1];
const president = web3.eth.accounts[0];

module.exports = async deployer => {
    
    try {
        await deployer.deploy(AddressBook, web3.eth.accounts[0]);

        await deployer.deploy(
            MockCasper,
            MIN_DEPOSIT_SIZE,
            EPOCH_LENGTH,
            DYNASTY_LOGOUT_DELAY,
            WITHDRAWAL_DELAY
        );

        await deployer.deploy(Treasury, MockCasper.address, AddressBook.address);

        await deployer.deploy(
            StakeManager,
            MockCasper.address,
            validator,
            Treasury.address,
            AddressBook.address
        );

        await deployer.deploy(
            DivisionsToken,
            AddressBook.address
        );

        await deployer.deploy(
            Exchange,
            DivisionsToken.address,
            StakeManager.address,
            MIN_BUY_ORDER_AMOUNT,
            MIN_SELL_ORDER_AMOUNT,
            AddressBook.address
        );

        await deployer.deploy(GovernanceToken, GOV_TOKEN_INITIAL_SUPPLY);
        await deployer.deploy(
            Senate,
            AddressBook.address,
            president,
            DEBATING_PERIOD_SECS,
            QUORUM_FRACTION_MULTIPLIED
        );

        await deployer.deploy(TokenVault, AddressBook.address, GOVERNANCE_TOKEN_NAME);

        let deployedAddressBook = AddressBook.at(AddressBook.address);
        await deployedAddressBook.registerEntry(TokenVault.address, Senate.address);
        await deployedAddressBook.registerEntry(StakeManager.address, Senate.address);
        await deployedAddressBook.registerEntry(Exchange.address, Senate.address);
        await deployedAddressBook.registerEntry(DivisionsToken.address, Senate.address);
        await deployedAddressBook.registerEntry(Treasury.address, Senate.address);
        
        await deployedAddressBook.setEntry(
            await deployedAddressBook.getEntryIdentifier("GovernanceToken"),
            GovernanceToken.address
        );

        let deployedTreasury = Treasury.at(Treasury.address);
        await deployedTreasury.setStakeManager(StakeManager.address);
        await deployedTreasury.setExchange(Exchange.address);
        
        let deployedDivToken = DivisionsToken.at(DivisionsToken.address);
        await deployedDivToken.transferMintership(Exchange.address);

        await deployedAddressBook.transferOwnership(Senate.address);

        let addresses = {
            tokenVault: TokenVault.address,
            senate: Senate.address,
            addressBook: AddressBook.address,
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