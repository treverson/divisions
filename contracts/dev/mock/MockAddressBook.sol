pragma solidity 0.4.23;

import "../../divisions/gov/AddressBook.sol";

contract MockAddressBook is AAddressBook {

    function setEntryOwner(AAddressBookEntry _addr, address _owner) external {
        require(address(_addr) != address(0), "addr cannot be 0");
        require(_owner != address(0), "owner cannot be 0");

        ownership[_addr] = _owner;

        emit EntryOwnerSet(_addr, _owner);
    }

    function setEntry(bytes32 _identifier, AAddressBookEntry _addr) external {
        require(_addr != address(0), "addr cannot be 0");
        index[_identifier] = _addr;
        emit EntrySet(_identifier, _addr);
    }

    function registerEntry(AAddressBookEntry _entry) external {
        index[getEntryIdentifier(_entry.name())] = _entry;
    }

    function getEntryIdentifier(string _name) public pure returns (bytes32 identifier) {
        return identifier = keccak256(_name);
    }
}