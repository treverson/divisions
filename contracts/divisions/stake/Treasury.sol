pragma solidity ^0.4.19;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

contract BaseTreasury is Ownable {
    address public treasurer;

    function() external payable;

    function totalPoolBalance() external view returns (uint256);

    function setTreasurer(address _treasurer) public onlyOwner();

    function depositToPool() public payable;
    function withdrawFromPool(address _to, uint256 _amount) external;
    
    function transfer(address _to, uint256 _amount) external;
    function deposit() external payable;

    event TreasurershipTransferred(address indexed previousTreasurer, address indexed newTreasurer);

    event DepositToPool(address indexed from, uint256 amount);
    event WithdrawFromPool(address indexed from, uint256 amount);

    event Deposit(address indexed from, uint256 amount);
    event Transfer(address indexed to, uint256 amount);
}

contract Treasury is BaseTreasury {

    function Treasury(address _treasurer) public {
        setTreasurer(_treasurer);
    }

    function() external payable {
    }

    function totalPoolBalance() external view returns (uint256){
        return 0;
    }

    function setTreasurer(address _treasurer) public onlyOwner() {
        require(_treasurer != address(0));

        TreasurershipTransferred(_treasurer, treasurer);
        treasurer = _treasurer;
    }

    function depositToPool() public payable {

    }

    function withdrawFromPool(address _to, uint256 _amount) external {

    }
    

    function transfer(address _to, uint256 _amount) external {

    }

    function deposit() external payable {

    }

    event TreasurershipTransferred(address indexed previousTreasurer, address indexed newTreasurer);

    event DepositToPool(address indexed from, uint256 amount);
    event WithdrawFromPool(address indexed from, uint256 amount);

    event Deposit(address indexed from, uint256 amount);
    event Transfer(address indexed to, uint256 amount);
}