// Contracts ABI + Bytecode
import { abi as Permit2ABI } from "../../artifacts/contracts/IPermit2.sol/IPermit2.json";
import {
	abi as ERC20ABI,
	bytecode as ERC20Bytecode,
} from "../../artifacts/contracts/Mocks/MockToken.sol/MockToken.json";
import {
	abi as WitnessABI,
	bytecode as WitnessBytecode,
} from "../../artifacts/contracts/mocks/WitnessMock.sol/WitnessTest.json";

import { ethers } from "ethers";
import { setCode } from "@nomicfoundation/hardhat-network-helpers";
import { permit2Address, permit2RuntimeBytecode } from ".";
import { SignerLike } from "permit2-helper";

type TokenConstructorArgs = {
	mintTokenTo: string[];
	mintAmount: ethers.BigNumberish;
};

export async function deployWitnessContract(
	signer: SignerLike,
	nonce: ethers.BigNumberish,
): Promise<ethers.Contract> {
	const witnessMockFactory = new ethers.ContractFactory(
		WitnessABI,
		WitnessBytecode,
		signer,
	);

	const witnessMock = (await witnessMockFactory.deploy(permit2Address, {
		nonce: nonce,
	})) as ethers.Contract;

	return witnessMock;
}

export async function deployToken(
	signer: SignerLike,
	nonce: ethers.BigNumberish,
	constructorArgs: TokenConstructorArgs,
): Promise<ethers.Contract> {
	const tokenFactory = new ethers.ContractFactory(
		ERC20ABI,
		ERC20Bytecode,
		signer,
	);

	const token = (await tokenFactory.deploy(
		constructorArgs.mintTokenTo,
		constructorArgs.mintAmount,
		{ nonce: nonce },
	)) as ethers.Contract;

	return token;
}

export async function deployPermit2(
	signer: SignerLike,
): Promise<ethers.Contract> {
	// Create contract at permit2Address
	await setCode(permit2Address, permit2RuntimeBytecode);

	// Get contract instance
	const permit2 = new ethers.Contract(permit2Address, Permit2ABI, signer);

	return permit2;
}
