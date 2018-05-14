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

const accounts = web3.eth.accounts;

const validator = accounts[1];
const president = accounts[0];

module.exports = async deployer => {
    
    try {
        /** Deploy contracts **/
        await deployer.deploy(AddressBook, accounts[0]);

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
            president,
            DEBATING_PERIOD_SECS,
            QUORUM_FRACTION_MULTIPLIED,
            AddressBook.address
        );

        await deployer.deploy(TokenVault, AddressBook.address, GOVERNANCE_TOKEN_NAME);

        /** Set parameters **/
        let deployedAddressBook = AddressBook.at(AddressBook.address);

        await deployedAddressBook.setEntryOwner(Treasury.address, accounts[0]);
        let deployedTreasury = Treasury.at(Treasury.address);
        await deployedTreasury.setStakeManager(StakeManager.address);
        await deployedTreasury.setExchange(Exchange.address);
        
        await deployedAddressBook.setEntryOwner(DivisionsToken.address, accounts[0]);
        let deployedDivToken = DivisionsToken.at(DivisionsToken.address);
        await deployedDivToken.transferMintership(Exchange.address);

        /** Register contracts at addressbook along with their owners **/

        await deployedAddressBook.registerEntryOwner(TokenVault.address, Senate.address);
        await deployedAddressBook.registerEntryOwner(StakeManager.address, Senate.address);
        await deployedAddressBook.registerEntryOwner(Exchange.address, Senate.address);
        await deployedAddressBook.registerEntryOwner(DivisionsToken.address, Senate.address);
        await deployedAddressBook.registerEntryOwner(Treasury.address, Senate.address);
        
        await deployedAddressBook.setEntry(
            await deployedAddressBook.getEntryIdentifier("GovernanceToken"),
            GovernanceToken.address
        );

        /** Transfer ownership of AddressBook to Senate **/
        await deployedAddressBook.transferOwnership(Senate.address);

        /** Store addresses in file **/

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