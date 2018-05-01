pragma solidity 0.4.23;

import "../../divisions/exchange/Exchange.sol";

contract MockExchange is AExchange {
    uint256 weiReserve_ = 0;
    uint256 divReserve_ = 0;
    
    function setMinBuyOrderAmount(uint256 _min) public onlyOwner(){

    }

    function setMinSellOrderAmount(uint256 _max) public onlyOwner(){

    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
    }

    //The length of the array of buy orders
    function buyOrdersLength() public view returns (uint256 length) {
        return length =  buyOrders.length;
    }

    //The length of the array of sell orders
    function sellOrdersLength() public view returns (uint256 length) {
        return length = sellOrders.length;
    }

    //The amount of wei currently in reserve
    function weiReserve() public view returns (uint256 reserve) {
        return reserve = weiReserve_;
    }

    //The amount of div currently in reserve
    function divReserve() public view returns (uint256 reserve) {
        return reserve = divReserve_;
    }

    //Place a buy order on the waiting list
    function placeBuyOrder() payable external {

    }
    //Place a sell order on the waiting list
    function placeSellOrder(uint256 _amount) external {

    }

    //Place a buy order and fill it immediately as much as possible
    function placeAndFillBuyOrder() payable external {

    }
    //Place a sell order and fill it immediately as much as possible
    function placeAndFillSellOrder(uint256 _amount) external {

    }

    //The amount of a buy order that can be filled immediately
    function buyOrderFillableAmount(uint256 _index) external view returns (uint256 amount) {

    }
    //The amount of a sell order that can be filled immediately
    function sellOrderFillableAmount(uint256 _index) external view returns (uint256 amount) {

    }

    //Get the order indexes of a buyer
    function getBuyOrderIndexes(address _buyer) public view returns (uint256[] indexes) {

    }
    //Get the order indexes of a seller
    function getSellOrderIndexes(address _seller) public view returns (uint256[] indexes) {

    }

    //Fills a buy order as far as possible, also filling sell orders with the equivalent amount in DIV
    function fillBuyOrder(uint256 _index) external {

    }
    //Fills a sell order as far as possible, also filling buy order with the equivalent amount in ether
    function fillSellOrder(uint256 _index) external {

    }

    //Cancels a buy order and refunds the amount that's left
    function cancelBuyOrder(uint256 _index) external {

    }
    //Cancels a sell order and refunds the amount that's left
    function cancelSellOrder(uint256 _index) external {

    }

    //Price of 10**18 DIV in Wei
    function divPrice() public view returns (uint256 price) {
        return 1e18;
    }
    //Converts an amount of wei to the DIV equivalent
    function toDiv(uint256 _weiAmount) external view returns (uint256 divAmount) {

    }
    //Converts an amount of DIV to the wei equivalent
    function toWei(uint256 _divAmount) external view returns (uint256 weiAmount) {

    }

    //Transfers wei to the treasury, minting an equivalent
    //amount DIV and filling open buy orders with it
    function transferWeiToTreasury(uint256 _amount) external {
        emit TransferWeiToTreasuryCalled(_amount);
    }
    //Fills open sell orders with the received ether deposit,
    //burning an equivalent amount of DIV
    function handleEtherDeposit() external payable {

    }

    function setDivReserve(uint256 _value) external {
        divReserve_ = _value;
    }

    function setWeiReserve(uint256 _value) external {
        weiReserve_ = _value;
    }

    event TransferWeiToTreasuryCalled(uint256 amount);

}