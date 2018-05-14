const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test AddressBook ============ //


const AddressBook = artifacts.require('AddressBook');

const MockAddressBookEntry = artifacts.require('MockAddressBookEntry');

contract('AddressBook', async accounts => {

    let addressBook;
    let owner = accounts[1];
    before(async () => {
        addressBook = await AddressBook.new(owner);
    });

    it('sets the owner of an address', async () => {
        let address = accounts[2];
        let addressOwner = accounts[3];
        await expectThrow(
            addressBook.setEntryOwner(0, addressOwner, { from: owner }),
            "The address cannot be 0"
        );

        await expectThrow(
            addressBook.setEntryOwner(address, 0, { from: owner }),
            "The owner cannot be 0"
        );

        await expectThrow(
            addressBook.setEntryOwner(address, addressOwner),
            "Only the owner of AddressBook can set the owner of an address"
        );

        await addressBook.setEntryOwner(address, addressOwner, { from: owner });

        assert.equal(
            await addressBook.ownership(address),
            addressOwner,
            "The address owner was not set"
        );
    });

    it('logs an event on setEntryOwner', async () => {
        let address = accounts[2];
        let addressOwner = accounts[3];
        await expectEvent(
            addressBook.setEntryOwner.sendTransaction(address, addressOwner, { from: owner }),
            addressBook.EntryOwnerSet(),
            { entry: address, owner: addressOwner }
        );
    });

    it('sets an identifier\'s address', async () => {
        let identifier = "identifier";
        let address = accounts[2];

        await expectThrow(
            addressBook.setEntry(identifier, 0, { from: owner }),
            "Address cannot be 0"
        );

        await expectThrow(
            addressBook.setEntry(identifier, address),
            "Only the owner of AddressBook can set the owner of an address"
        );

        await addressBook.setEntry(identifier, address, { from: owner });

        assert.equal(
            await addressBook.index(identifier),
            address,
            "The address was not set"
        );
    });

    it('logs an event on setEntry', async () => {
        let identifier = web3.toHex("identifier").padEnd(66, '0');
        let address = accounts[2];

        await expectEvent(
            addressBook.setEntry.sendTransaction(identifier, address, { from: owner }),
            addressBook.EntrySet(),
            { identifier: identifier, entry: address }
        );
    });

    it('registers entries', async () => {
        let expectedEntry = await MockAddressBookEntry.new(addressBook.address);
        let identifier = await expectedEntry.identifier();

        await expectThrow(
            addressBook.registerEntry(expectedEntry.address),
            "Only the owner can register entries"
        );

        await addressBook.registerEntry(expectedEntry.address, { from: owner });

        let actualEntryAddress = await addressBook.index(identifier);

        assert.equal(
            actualEntryAddress,
            expectedEntry.address,
            "The entry was not stored"
        );
    });

    it('logs an event on registerEntry', async () => {
        let entry = await MockAddressBookEntry.new(addressBook.address);
        
        await expectEvent(
            addressBook.registerEntry.sendTransaction(entry.address, { from: owner }),
            addressBook.EntrySet(),
            {
                identifier: await entry.identifier(),
                entry: entry.address
            }
        );
    });

    it('registers entries with their owners', async () => {
        let expectedEntry = await MockAddressBookEntry.new(addressBook.address);
        let identifier = await expectedEntry.identifier();
        let expectedEntryOwner = accounts[5];

        await expectThrow(
            addressBook.registerEntryOwner(
                expectedEntry.address,
                expectedEntryOwner
            ),
            "Only the owner can register entries with their owners"
        );

        await addressBook.registerEntryOwner(
            expectedEntry.address,
            expectedEntryOwner,
            { from: owner }
        );

        let actualEntryAddress = await addressBook.index(identifier);
        let actualEntryOwner = await addressBook.ownership(expectedEntry.address);

        assert.equal(
            actualEntryAddress,
            expectedEntry.address,
            "The entry's address was not stored"
        );

        assert.equal(
            actualEntryOwner,
            expectedEntryOwner,
            "The entry's owner was not stored"
        );
    });

    it('logs an event on registerEntryOwner', async () => {
        let entry = await MockAddressBookEntry.new(addressBook.address);
        let entryOwner = accounts[4];
        await expectEvent(
            addressBook.registerEntryOwner.sendTransaction(
                entry.address,
                entryOwner,
                { from: owner }
            ),
            addressBook.EntrySet(),
            {
                identifier: await entry.identifier(),
                entry: entry.address
            }
        );
        await expectEvent(
            addressBook.registerEntryOwner.sendTransaction(
                entry.address,
                entryOwner,
                { from: owner }
            ),
            addressBook.EntryOwnerSet(),
            {
                entry: entry.address,
                owner: entryOwner
            }
        );
    });
});