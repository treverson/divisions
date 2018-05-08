pragma solidity 0.4.23;

import "./AddressBook.sol";

contract AAddressBookEntry {
    AAddressBook public addressBook;
    bytes32 public identifier;
    string public name;
}

contract AddressBookEntry is AAddressBookEntry {
    
    constructor(AAddressBook _addressBook, string _name) public {
        addressBook = _addressBook;
        name = _name;
        identifier = addressBook.getEntryIdentifier(_name);
    }

    function getEntry(string _name) internal view returns (AAddressBookEntry entry) {
        return entry = addressBook.index(addressBook.getEntryIdentifier(_name));
    }

    modifier onlyOwner() {
        require(msg.sender == addressBook.ownership(this), "Only the owner can call this function");
        _;
    }
}
