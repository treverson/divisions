pragma solidity 0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./AddressBookEntry.sol";

contract AAddressBook is Ownable {
    mapping(address => address) public ownership;
    mapping(bytes32 => AAddressBookEntry) public index;

    function setEntryOwner(AAddressBookEntry _addr, address _owner) external onlyOwner;

    function setEntry(bytes32 _identifier, AAddressBookEntry _entry) external onlyOwner;

    function registerEntry(AAddressBookEntry _entry) external onlyOwner;
    
    function registerEntryOwner(AAddressBookEntry _entry, address _owner) external onlyOwner;

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

    function setEntry(bytes32 _identifier, AAddressBookEntry _entry) external onlyOwner {
        require(_entry != address(0), "addr cannot be 0");
        index[_identifier] = _entry;
        emit EntrySet(_identifier, _entry);
    }

    function registerEntry(AAddressBookEntry _entry) external onlyOwner {
        bytes32 identifier = _entry.identifier();
        index[identifier] = _entry;
        emit EntrySet(identifier, _entry);
    }

    function registerEntryOwner(AAddressBookEntry _entry, address _owner) external onlyOwner {
        bytes32 identifier = _entry.identifier();
        index[identifier] = _entry;
        ownership[address(_entry)] = _owner;
        emit EntrySet(identifier, _entry);
        emit EntryOwnerSet(_entry, _owner);
    }

    function getEntryIdentifier(string _name) public pure returns (bytes32 identifier) {
        return identifier = keccak256(_name);
    }
}