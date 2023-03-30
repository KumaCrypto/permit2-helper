//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
	constructor(
		address[] memory mintTo,
		uint256 baseAmount
	) ERC20("MockToken", "MT") {
		for (uint256 i; i < mintTo.length; i++) {
			_mint(mintTo[i], baseAmount);
		}
	}
}
