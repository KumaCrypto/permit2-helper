//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {IPermit2} from "../IPermit2.sol";

contract WitnessTest {
	struct Witness {
		address user; // Address of the user that signer is giving the tokens to
	}

	string private constant WITNESS_TYPE_STRING =
		"Witness witness)TokenPermissions(address token,uint256 amount)Witness(address user)";

	bytes32 private constant WITNESS_TYPEHASH =
		keccak256("Witness(address user)");

	mapping(address user => mapping(address token => uint256 balance))
		public tokenBalancesByUser;

	IPermit2 public immutable PERMIT2;

	constructor(IPermit2 permit2) {
		PERMIT2 = permit2;
	}

	function deposit(
		uint256 amount,
		address token,
		address owner,
		address user,
		IPermit2.PermitTransferFrom calldata permit,
		bytes calldata signature
	) external {
		PERMIT2.permitWitnessTransferFrom(
			permit,
			IPermit2.SignatureTransferDetails({
				to: address(this),
				requestedAmount: amount
			}),
			owner,
			// witness
			keccak256(abi.encode(WITNESS_TYPEHASH, Witness(user))),
			// witnessTypeString,
			WITNESS_TYPE_STRING,
			signature
		);

		tokenBalancesByUser[user][token] += amount;
	}
}
