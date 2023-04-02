import { expect } from "chai";
import { describe } from "mocha";
import { ethers } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { connectSigner, baseFixture } from "./helper";

describe("Permit2 | permitTransferFrom", function () {
	it("permitTransferFrom", async function () {
		const {
			permit2Helper,
			permit2,
			token,
			defaultTokenBalance,
			spender,
			approver,
		} = await loadFixture(baseFixture);

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
				to: paramsToSign.spender,
				requestedAmount: paramsToSign.permitted.amount,
			},
			approver.address, // Who sign msg
			signature,
		);

		const balanceAfter = await token.balanceOf(spender.address);

		expect(balanceBefore + defaultTokenBalance).eq(balanceAfter);
	});
});
