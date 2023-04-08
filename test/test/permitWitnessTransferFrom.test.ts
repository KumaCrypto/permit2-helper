import { ethers } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { baseFixture, connectSigner } from "./helper";

import { expect } from "chai";

describe("Permit2 | permitWitnessTransferFrom", function () {
	it("permitWitnessTransferFrom", async function () {
		const {
			permit2Helper,
			token,
			defaultTokenBalance,
			spender,
			approver,
			witnessMock,
		} = await loadFixture(baseFixture);

		const tokenDetails = {
			token: token.target.toString(),
			amount: defaultTokenBalance.toString(),
		};

		const paramsToSign = {
			permitted: tokenDetails,
			spender: witnessMock.target.toString(),
			nonce: 1,
			deadline: ethers.MaxUint256 / 2n,
		};

		const witnessValue = {
			witness: { user: spender.address },
		};

		const witnessTyping = {
			witnessType: { type: "Witness", name: "witness" },
			witnessSubTypes: { Witness: [{ type: "address", name: "user" }] },
		};

		const signature = await permit2Helper.signPermitWitnessTransferFrom(
			paramsToSign,
			witnessValue,
			{
				witnessType: witnessTyping.witnessType,
				witnessSubTypes: witnessTyping.witnessSubTypes,
			},
		);

		// No spender!
		const paramsForTransferFrom = {
			permitted: paramsToSign.permitted,
			nonce: paramsToSign.nonce,
			deadline: paramsToSign.deadline,
		};

		const balanceBefore = await witnessMock.tokenBalancesByUser(
			spender.address,
			token.target,
		);

		await connectSigner(witnessMock, spender).deposit(
			paramsForTransferFrom.permitted.amount,
			paramsForTransferFrom.permitted.token,
			approver.address,
			spender.address,
			paramsForTransferFrom,
			signature,
		);

		const balanceAfter = await witnessMock.tokenBalancesByUser(
			spender.address,
			token.target,
		);

		expect(balanceBefore + defaultTokenBalance).eq(balanceAfter);
	});
});
