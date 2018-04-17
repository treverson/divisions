pragma solidity 0.4.21;

import "../../divisions/stake/WithdrawalBox.sol";

contract MockWithdrawalBox is AWithdrawalBox {
    
    function sweep() external {
        emit SweepCalled();
    }

    function setLogoutEpoch(uint256 _logoutEpoch) external {
        logoutEpoch = _logoutEpoch;

    }

    event SweepCalled();
    event SetScaledDepositCalled(uint256 scaledDeposit);
    event SetLogoutEpochCalled(uint256 logoutEpoch);
}