pragma solidity 0.4.24;

import "../../../divisions/stake/WithdrawalBox.sol";

contract MockWithdrawalBox is AWithdrawalBox {
    
    function sweep() external {
        emit SweepCalled();
    }

    event SweepCalled();
    event SetScaledDepositCalled(uint256 scaledDeposit);
    event SetLogoutEpochCalled(uint256 logoutEpoch);
}