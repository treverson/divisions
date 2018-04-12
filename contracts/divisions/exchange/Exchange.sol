pragma solidity 0.4.21;

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
    function placeSellOrder(uint256 _amount) external;

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

    function buyOrdersLength() public view returns (uint256) {
        return buyOrders.length;
    }
    function sellOrdersLength() public view returns (uint256) {
        return sellOrders.length;
    }

    function weiReserve() public view returns (uint256) {
        return address(this).balance.sub(totalPayments);
    }
    function divReserve() public view returns (uint256) {
        return divToken.balanceOf(address(this));
    }

    function placeBuyOrder() payable external {
        require(msg.value > 0);
        buyOrders.push(Order ({
            sender: msg.sender,
            amount: msg.value,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(msg.value),
            amountFilled: 0
        }));

        emit BuyOrderPlaced(buyOrders.length - 1, msg.sender, msg.value);
    }
    function placeSellOrder(uint256 _amount) external {
        require(_amount > 0);
        divToken.transferFrom(msg.sender, address(this), _amount);

        sellOrders.push(Order ({
            sender: msg.sender,
            amount: _amount,
            cumulativeAmount: lastBuyOrderCumulativeAmount().add(_amount),
            amountFilled: 0
        }));

        emit SellOrderPlaced(buyOrders.length - 1, msg.sender, _amount);
    }

    function canFillBuyOrderAmount(uint256 _index) public view returns (uint256) {
        return 0;
    }
    function canFillSellOrderAmount(uint256 _index) public view returns (uint256) {
        return 0;
    }

    function getBuyOrder(uint256 _index) external view returns (address, uint256, bool, uint256) {
        return (address(0), 0, false, 0);
    }
    function getSellOrder(uint256 _index) external view returns (address, uint256, bool, uint256) {
        return (address(0), 0, false, 0);
    }

    function fillBuyOrder(uint256 _index) external {

    }
    function fillSellOrder(uint256 _index) external {

    }

    function divPrice() public view returns (uint256) { //Price of 10**18 DIV in Wei

    }

    function toDiv(uint256 _weiAmount) public view returns (uint256) {

    }
    function toWei(uint256 _divAmount) public view returns (uint256) {

    }

    function transferWeiToTreasury(uint256 amount) external {

    }
    function handleDepositFromTreasury() external payable {
        
    }

    function lastBuyOrderCumulativeAmount() private view returns (uint256) {
        if(buyOrders.length == 0) return 0;
        else return buyOrders[buyOrders.length - 1].cumulativeAmount;
    }

    function lastSellOrderCumulativeAmount() private view returns (uint256) {
        if(sellOrders.length == 0) return 0;
        else return sellOrders[sellOrders.length - 1].cumulativeAmount;
    }

}