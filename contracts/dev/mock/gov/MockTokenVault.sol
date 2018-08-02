pragma solidity 0.4.24;

import "../../../divisions/gov/TokenVault.sol";
import "../token/MockTokenRecipient.sol";

contract MockTokenVault is ITokenVault, MockTokenRecipient {

    function lockTokens(address _addr, uint256 _amount, uint256 _unlockAtBlock) external {
        // TODO
    }

    function unlockTokens(uint256 _amount) external {
       // TODO
    }

}