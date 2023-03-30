import { expect } from "chai";
import { describe } from "mocha";

import { ethers } from "ethers";

import { network } from "hardhat";
import {
	setCode,
	loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";

import {
	createSignerAndFundBalance,
	permit2Address,
	permit2RuntimeBytecode,
	connectSigner,
} from "./helper";

// Contracts ABI + Bytecode
import { abi as Permit2ABI } from "../artifacts/contracts/IPermit2.sol/IPermit2.json";
import {
	abi as ERC20ABI,
	bytecode as ERC20Bytecode,
} from "../artifacts/contracts/Mocks/MockToken.sol/MockToken.json";

import { Permit2 } from "permit2-helper";

describe("Lock", function () {
	//  ||  ||  ||  ||  ||  ||  ||  ||
	//  \/  \/  \/  \/  \/  \/  \/  \/
	// We have to get out of harhdat/ethers because it's not compatible with ethers ^6.0.0
	//  /\  /\  /\  /\  /\  /\  /\  /\
	//  ||  ||  ||  ||  ||  ||  ||  ||
	async function fixture() {
		// Set provider and get signers
		const provider = new ethers.BrowserProvider(network.provider);

		const [owner, approver, spender] = await Promise.all(
			[1, 2, 3].map((val) => createSignerAndFundBalance(val, provider)),
		);

		// Create contract at permit2Address
		await setCode(permit2Address, permit2RuntimeBytecode);

		// Get contract instance

		const permit2 = new ethers.Contract(permit2Address, Permit2ABI, owner);

		// Deploy token and get instance
		const tokenFactory = new ethers.ContractFactory(
			ERC20ABI,
			ERC20Bytecode,
			owner,
		);

		const defaultTokenBalance = ethers.parseEther("1000");

		const token = (await tokenFactory.deploy(
			[owner.address, approver.address],
			defaultTokenBalance,
		)) as ethers.Contract;

		await connectSigner(token, approver).approve(
			permit2.target,
			ethers.MaxUint256,
		);

		// Create permit2Helper instance
		const permit2Helper = new Permit2({ signer: approver });

		return {
			owner,
			approver,
			spender,
			permit2Helper,
			permit2,
			token,
			defaultTokenBalance,
		};
	}

	describe("SignatureTransfers", function () {
		it("permitTransferFrom", async function () {
			const {
				permit2Helper,
				permit2,
				token,
				defaultTokenBalance,
				spender,
				approver,
			} = await loadFixture(fixture);

			const tokenDetails = {
				token: token.target.toString(),
				amount: defaultTokenBalance.toString(),
			};

			const paramsToSign = {
				permitted: tokenDetails,
				spender: spender.address,
				nonce: 1,
				deadline: ethers.MaxUint256 / 2n,
			};

			const signature = await permit2Helper.signPermitTransferFrom(
				paramsToSign,
			);

			// No spender!
			const paramsForTransferFrom = {
				permitted: paramsToSign.permitted,
				nonce: paramsToSign.nonce,
				deadline: paramsToSign.deadline,
			};

			const balanceBefore = await token.balanceOf(spender.address);

			await connectSigner(permit2, spender).permitTransferFrom(
				paramsForTransferFrom,
				{
					to: spender.address,
					requestedAmount: tokenDetails.amount,
				},
				approver.address, // Who sign msg
				signature,
			);

			const balanceAfter = await token.balanceOf(spender.address);

			expect(balanceBefore + defaultTokenBalance).eq(balanceAfter);
		});
	});
});
