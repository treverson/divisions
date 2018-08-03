const fs = require('fs');

const path = require('path');
const conf = require(path.join(__dirname, 'migrationConfig'));

let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let StakeManager = artifacts.require('StakeManager');

let DivisionsToken = artifacts.require('DivisionsToken');
let Exchange = artifacts.require('Exchange');

let GovernanceToken = artifacts.require('GovernanceToken');
let TokenVault = artifacts.require('TokenVault');
let DelegatingSenate = artifacts.require('DelegatingSenate');


module.exports = async (deployer, network, accounts) => {
    let validator = accounts[0];
    let president = accounts[0];

    try {
        /** Register Exchange with StakeManager */
        console.log('Registering Exchange with StakeManager')
        let deployedStakeManager = StakeManager.at(StakeManager.address);
        await deployedStakeManager.setExchange(Exchange.address);

        /** Register StakeManager with Treasury */
        console.log('Registering StakeManager with Treasury');
        let deployedTreasury = Treasury.at(Treasury.address);
        await deployedTreasury.setStakeManager(StakeManager.address);

        /** Register Exchange with Treasury */
        console.log('Registering Exchange with Treasury');
        await deployedTreasury.setExchange(Exchange.address);

        /** Set DIV minter **/
        let deployedDivToken = DivisionsToken.at(DivisionsToken.address);
        console.log('Transfering DivisionsToken mintership to Exchange ' + Exchange.address );
        await deployedDivToken.transferMintership(Exchange.address);

        /** Transfer ownership of ownable contracts to DelegatingSenate **/
        
        console.log('Transfering ownership of TokenVault to DelegatingSenate ' + DelegatingSenate.address);
        let deployedTokenVault = TokenVault.at(TokenVault.address);
        await deployedTokenVault.transferOwnership(DelegatingSenate.address);
    

        console.log('Transfering ownership of StakeManager to DelegatingSenate ' + DelegatingSenate.address);
        await deployedStakeManager.transferOwnership(DelegatingSenate.address);
        

        console.log('Transfering ownership of Exchange to DelegatingSenate ' + DelegatingSenate.address);
        let deployedExchange = Exchange.at(Exchange.address);
        await deployedExchange.transferOwnership(DelegatingSenate.address);

        console.log('Transfering ownership of DivisionsToken to DelegatingSenate ' + DelegatingSenate.address);
        let deployedDivisionsToken = DivisionsToken.at(DivisionsToken.address);
        await deployedDivisionsToken.transferOwnership(DelegatingSenate.address);

        console.log('Transfering ownership of Treasury to Senate ' + DelegatingSenate.address);
        await deployedTreasury.transferOwnership(DelegatingSenate.address);

        /** Store addresses in file **/
        let addresses = {
            tokenVault: TokenVault.address,
            delegatingSenate: DelegatingSenate.address,
            casper: MockCasper.address,
            treasury: Treasury.address,
            stakeManager: StakeManager.address,
            divisionToken: DivisionsToken.address,
            exchange: Exchange.address,
            governanceToken: GovernanceToken.address
        };

        let addressesJson = JSON.stringify(addresses);
        console.log('Writing addresses to ' + conf.ADDRESS_JSON_PATH);
        fs.writeFileSync(conf.ADDRESS_JSON_PATH, addressesJson);

        console.log('Done!');
    } catch (err) {
        console.log(err);
    }

}