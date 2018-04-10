pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/payment/PullPayment.sol";

import "../stake/Treasury.sol";
import "../token/DivisionsToken.sol";

contract AExchange is Ownable, PullPayment {
    ATreasury public treasury;
    ADivisionsToken public divToken;

    struct Order {
        address sender;
        uint256 amount; 
        bool processed;
        uint256 amountFilled;
    }

    Order[] public buyOrders;
    uint256 public buyOrderCursor;

    Order[] public sellOrders;
    uint256 public sellOrderCursor;

    function weiReserve() public view returns (uint256);
    function divReserve() public view returns (uint256);

    function placeBuyOrder() payable external;
    function placeSellOrder() external;

    function canFillBuyOrderAmount(uint256 _index) public view returns (uint256);
    function canFillSellOrderAmount(uint256 _index) public view returns (uint256);

    function getBuyOrderTuple(uint256 _index) external view returns (address, uint256, bool, uint256);
    function getSellOrderTuple(uint256 _index) external view returns (address, uint256, bool, uint256);

    function fillBuyOrder(uint256 _index) external;
    function fillSellOrder(uint256 _index) external;

    function divPrice() public view returns (uint256); //Price of 10**18 DIV in Wei
    function toDiv(uint256 _weiAmount) public view returns (uint256);
    function toWei(uint256 _divAmount) public view returns (uint256);

    event BuyOrderPlaced(uint256 index);
    event BuyOrderFilled(uint256 index, uint256 amountFilled);
    
    event SellOrderPlaced(uint256 index);
    event SellOrderFilled(uint256 index, uint256 amountFilled);

    event WeiReserveUpdated(uint256 weiReserve);
    event DivReserveUpdated(uint256 divReserve);
    
}

contract Exchange is AExchange {

}