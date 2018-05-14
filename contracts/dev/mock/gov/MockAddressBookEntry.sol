pragma solidity 0.4.23;

import "../../../divisions/gov/AddressBookEntry.sol";

contract MockAddressBookEntry is AddressBookEntry {
    constructor(AAddressBook _addressBook)
    AddressBookEntry(_addressBook, "MockAddressBookEntry")
    public
    {}
}