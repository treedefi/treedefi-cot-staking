// TreedefiCOTStakingWhitelist.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TreedefiCOTStakingWhitelist is Ownable {
    mapping (address => bool) private _whitelist;

    function addToWhitelist(address user) external onlyOwner {
        _whitelist[user] = true;
    }

    function removeFromWhitelist(address user) external onlyOwner {
        _whitelist[user] = false;
    }

    function isWhitelisted(address user) external view returns (bool) {
        return _whitelist[user];
    }
}
