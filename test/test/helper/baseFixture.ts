import { ethers } from "ethers";
import { network } from "hardhat";
import { createSignerAndFundBalance, connectSigner } from ".";
import { Permit2 } from "permit2-helper";
import {
	deployPermit2,
	deployToken,
	deployWitnessContract,
} from "./deployments";

//  ||  ||  ||  ||  ||  ||  ||  ||
//  \/  \/  \/  \/  \/  \/  \/  \/
// We have to get out of hardhat/ethers because it's not compatible with ethers ^6.0.0
//  /\  /\  /\  /\  /\  /\  /\  /\
//  ||  ||  ||  ||  ||  ||  ||  ||
export async function baseFixture() {
	// Set provider and get signers
	const provider = new ethers.BrowserProvider(network.provider);

	const [owner, approver, spender] = await Promise.all(
		[1, 2, 3].map((val) => createSignerAndFundBalance(val, provider)),
	);

	// Get contracts
	const permit2 = await deployPermit2(owner);

	const defaultTokenBalance = ethers.parseEther("1000");

	// We must provide nonce directly, since Ethers has problems with handling nonce incrementations
	const token = await deployToken(owner, 0, {
		mintTokenTo: [owner.address, approver.address],
		mintAmount: defaultTokenBalance,
	});

	const witnessMock = await deployWitnessContract(owner, 1);

	await connectSigner(token, approver).approve(
		permit2.target,
		ethers.MaxUint256,
	);

	const permit2Helper = new Permit2({ signer: approver });

	return {
		owner,
		approver,
		spender,
		permit2Helper,
		permit2,
		token,
		defaultTokenBalance,
		witnessMock,
	};
}
