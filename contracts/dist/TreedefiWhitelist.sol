// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TreedefiWhitelist is Ownable {
    mapping (address => bool) private _whitelist;

    function addToWhitelist(address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            _whitelist[users[i]] = true;
        }
    }

    function removeFromWhitelist(address[] calldata users) external onlyOwner {
        for (uint i = 0; i < users.length; i++) {
            _whitelist[users[i]] = false;
        }
    }

    function isWhitelisted(address user) external view returns (bool) {
        return _whitelist[user];
    }

}
