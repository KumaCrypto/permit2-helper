// Taken from: https://github.com/dragonfly-xyz/useful-solidity-patterns/blob/main/patterns/permit2/Permit2Vault.sol

//SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

// Minimal Permit2 interface, derived from
// https://github.com/Uniswap/permit2/blob/main/src/interfaces/ISignatureTransfer.sol
interface IPermit2 {
	error AllowanceExpired(uint256 deadline);

	error InsufficientAllowance(uint256 amount);

	error ExcessiveInvalidation();

	error InvalidAmount(uint256 maxAmount);

	error LengthMismatch();

	event UnorderedNonceInvalidation(
		address indexed owner,
		uint256 word,
		uint256 mask
	);

	// Token and amount in a permit message.
	struct TokenPermissions {
		// Token to transfer.
		IERC20 token;
		// Amount to transfer.
		uint256 amount;
	}

	// The permit2 message.
	struct PermitTransferFrom {
		// Permitted token and amount.
		TokenPermissions permitted;
		// Unique identifier for this permit.
		uint256 nonce;
		// Expiration for this permit.
		uint256 deadline;
	}

	// Transfer details for permitTransferFrom().
	struct SignatureTransferDetails {
		// Recipient of tokens.
		address to;
		// Amount to transfer.
		uint256 requestedAmount;
	}

	// Consume a permit2 message and transfer tokens.
	function permitTransferFrom(
		PermitTransferFrom calldata permit,
		SignatureTransferDetails calldata transferDetails,
		address owner,
		bytes calldata signature
	) external;

	function permitWitnessTransferFrom(
		PermitTransferFrom memory permit,
		SignatureTransferDetails calldata transferDetails,
		address owner,
		bytes32 witness,
		string calldata witnessTypeString,
		bytes calldata signature
	) external;

	function DOMAIN_SEPARATOR() external view returns (bytes32);
}

// Minimal ERC20 interface.
interface IERC20 {
	function transfer(address to, uint256 amount) external returns (bool);
}
