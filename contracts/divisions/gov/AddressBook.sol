pragma solidity 0.4.23;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./AddressBookEntry.sol";

contract AAddressBook is Ownable {
    mapping(address => address) public ownership;
    mapping(bytes32 => AAddressBookEntry) public index;

    function setEntryOwner(AAddressBookEntry _addr, address _owner) external onlyOwner;

    function setEntry(bytes32 _identifier, AAddressBookEntry _addr) external onlyOwner;

    function registerEntry(AAddressBookEntry _entry) external onlyOwner;
 
    function getEntryIdentifier(string _name) public pure returns (bytes32 identifier);

    event EntryOwnerSet(AAddressBookEntry indexed entry, address owner);
    event EntrySet(bytes32 indexed identifier, AAddressBookEntry indexed entry);
}

contract AddressBook is AAddressBook {
    constructor(address _owner) public {
        transferOwnership(_owner);
    }

    function setEntryOwner(AAddressBookEntry _addr, address _owner) external onlyOwner {
        require(address(_addr) != address(0), "addr cannot be 0");
        require(_owner != address(0), "owner cannot be 0");

        ownership[_addr] = _owner;

        emit EntryOwnerSet(_addr, _owner);
    }

    function setEntry(bytes32 _identifier, AAddressBookEntry _addr) external onlyOwner {
        require(_addr != address(0), "addr cannot be 0");
        index[_identifier] = _addr;
        emit EntrySet(_identifier, _addr);
    }

    function registerEntry(AAddressBookEntry _entry) external onlyOwner {
        index[getEntryIdentifier(_entry.name())] = _entry;
    }

    function getEntryIdentifier(string _name) public pure returns (bytes32 identifier) {
        return identifier = keccak256(_name);
    }
}