// TreedefiCOTStakingUpgradeableV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TreedefiCOTStakingUpgradeable.sol";

contract TreedefiCOTStakingUpgradeableV2 is TreedefiCOTStakingUpgradeable {
    
    // Add the new variable to the contract
    uint256 public dummyVariable;

    // Add the new function to the contract
    function dummyFunction(uint256 newValue) public onlyRole(DEFAULT_ADMIN_ROLE) {
        dummyVariable = newValue;
    }
}
