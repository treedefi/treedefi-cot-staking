// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma abicoder v2;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import "./dist/TreedefiCOTStaking.sol";
import "./dist/TreedefiWhitelist.sol";


contract TreedefiStakingFactory is Ownable {
    event NewTreedefiStakingContract(address indexed cotStaking);

    constructor() {
        //
    }

    /** 
     * @notice Deploy the pool
     */
    function deployPool(
        IERC20Metadata _cotToken,
        TreedefiWhitelist _whitelist,
        uint256 _poolSize,
        uint256 _rewardRate,
        uint256 _minStackingLockTime,
        uint256 _poolDuration,
        uint256 _maxStakePerUser
    ) external onlyOwner {
        require(_cotToken.totalSupply() >= 0);

        bytes memory bytecode = type(TreedefiCOTStaking).creationCode;
        // pass constructor argument
        bytecode = abi.encodePacked(
            bytecode
        );
        bytes32 salt = keccak256(abi.encodePacked(address(_cotToken), _maxStakePerUser, _poolDuration));
        address cotStakingAddress;

        assembly {
            cotStakingAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        TreedefiCOTStaking(cotStakingAddress).initialize(
         address(_cotToken),
         address(_whitelist),
         _poolSize,
         _rewardRate,
         _minStackingLockTime,
         _poolDuration,
         _maxStakePerUser
        );

        emit NewTreedefiStakingContract(cotStakingAddress);
    }
}