pragma solidity 0.4.24;

import "../../../divisions/stake/StakeManager.sol";

import "./MockWithdrawalBox.sol";

contract MockStakeManager is AStakeManager {
    
    constructor(ACasper _casper, ATreasury _treasury)
    SenateOwnable(IDelegatingSenate(msg.sender))
    public
    {
        casper = _casper;
        treasury = _treasury;
    }

    function withdrawalBoxesLength() external view returns (uint256 length) {
        return withdrawalBoxes.length;
    }

    function transferValidatorship(address _validator) external onlyOwner() {

    }

    function setTreasury(ATreasury _treasury) external onlyOwner() {

    }

    function getStakeableAmount() public view returns (uint256 amount){ 
        return amount = address(treasury).balance;
    }
    function makeStakeDeposit() external{
        AWithdrawalBox withdrawalBox = new MockWithdrawalBox();
        
        uint256 depositSize = getStakeableAmount();

        treasury.stake(depositSize, validator, withdrawalBox);

        withdrawalBoxes.push(withdrawalBox);

        emit WithdrawalBoxDeployed(withdrawalBox);
    }

    function setExchange(AExchange _exchange) external {
        exchange = _exchange;
    }
    
    function vote(
        bytes _voteMessage,
        uint256 _validatorIndex,
        bytes32 _targetHash,
        uint256 _targetEpoch,
        uint256 _sourceEpoch
        )
        external 
    {

    }

    function getVoteMessage(uint256 _validatorIndex, uint256 _targetEpoch)
        public
        view
        returns (
            bytes messageRLP,
            bytes32 targetHash,
            uint256 targetEpoch,
            uint256 sourceEpoch,
            uint256 castAt,
            bool accepted
        ) 
    {

    }

    function logout(
        AWithdrawalBox _withdrawalBox,
        bytes _messageRLP,
        uint256 _validatorIndex,
        uint256 _epoch
    )
        external
    {
    }

    function simulateFillTreasury(uint256 _amount) external {
        exchange.transferWeiToTreasury(_amount);
    }

}