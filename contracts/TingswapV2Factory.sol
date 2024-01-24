// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity =0.8.4;

import {ITingswapV2Factory} from "./interfaces/ITingswapV2Factory.sol";
import {ITingswapV2Pair} from "./interfaces/ITingswapV2Pair.sol";
import {TingswapV2Pair} from "./TingswapV2Pair.sol";

contract TingswapV2Factory is ITingswapV2Factory {
    bytes32 public constant PAIR_HASH =
        keccak256(type(TingswapV2Pair).creationCode);

    address public override feeTo;
    address public override feeToSetter;

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view override returns (uint256) {
        return allPairs.length;
    }

    function createPair(
        address tokenA,
        address tokenB
    ) external override returns (address pair) {
        require(tokenA != tokenB, "TingswapV2: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "TingswapV2: ZERO_ADDRESS");
        require(
            getPair[token0][token1] == address(0),
            "TingswapV2: PAIR_EXISTS"
        ); // single check is sufficient

        pair = address(
            new TingswapV2Pair{
                salt: keccak256(abi.encodePacked(token0, token1))
            }()
        );
        ITingswapV2Pair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, "TingswapV2: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, "TingswapV2: FORBIDDEN");
        feeToSetter = _feeToSetter;
    }
}
