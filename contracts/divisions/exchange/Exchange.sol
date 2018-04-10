pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/payment/PullPayment.sol";

import "../stake/Treasury.sol";
import "../stake/StakeManager.sol";
import "../token/DivisionsToken.sol";

contract AExchange is Ownable, PullPayment {
    ATreasury public treasury;
    ADivisionsToken public divToken;
    AStakeManager public stakeManager;

    struct Order {
        address sender;
        uint256 amount; 
        uint256 cumulativeAmount;
        uint256 amountFilled;
    }

    Order[] public buyOrders;
    uint256 public buyOrderCursor;

    Order[] public sellOrders;
    uint256 public sellOrderCursor;

    function buyOrdersLength() public view returns (uint256);
    function sellOrdersLength() public view returns (uint256);

    function weiReserve() public view returns (uint256);
    function divReserve() public view returns (uint256);

    function placeBuyOrder() payable external;
    function placeSellOrder() external;

    function canFillBuyOrderAmount(uint256 _index) public view returns (uint256);
    function canFillSellOrderAmount(uint256 _index) public view returns (uint256);

    function getBuyOrder(uint256 _index) external view returns (address, uint256, bool, uint256);
    function getSellOrder(uint256 _index) external view returns (address, uint256, bool, uint256);

    function fillBuyOrder(uint256 _index) external;
    function fillSellOrder(uint256 _index) external;

    function divPrice() public view returns (uint256); //Price of 10**18 DIV in Wei
    function toDiv(uint256 _weiAmount) public view returns (uint256);
    function toWei(uint256 _divAmount) public view returns (uint256);

    function transferWeiToTreasury(uint256 amount) external;
    function handleDepositFromTreasury() external payable;

    event BuyOrderPlaced(uint256 index, address sender, uint256 amount);
    event BuyOrderFilled(uint256 indexed index, uint256 amountFilled);
    
    event SellOrderPlaced(uint256 index, address sender, uint256 amount);
    event SellOrderFilled(uint256 indexed index, uint256 amountFilled);

    event WeiReserveUpdated(uint256 weiReserve);
    event DivReserveUpdated(uint256 divReserve);
}

contract Exchange is AExchange {

    function Exchange(ADivisionsToken _divToken, AStakeManager _stakeManager) public {
        divToken = _divToken;
        stakeManager = _stakeManager;
    }

}