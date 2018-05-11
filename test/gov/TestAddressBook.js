const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test AddressBook ============ //


const AddressBook = artifacts.require('AddressBook');

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
            { addr: address, owner: addressOwner }
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
        let identifier = "identifier";
        let address = accounts[2];

        await expectEvent(
            addressBook.setEntry.sendTransaction(identifier, address, {from: owner}),
            addressBook.EntrySet(),
            {identifier:  identifier, address: address}
        );
    });

    it('registers entries', async () => {
        assert.fail('TODO');
    });
});