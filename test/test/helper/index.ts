import { ethers, BigNumberish } from "ethers";
import { setBalance } from "@nomicfoundation/hardhat-network-helpers";

export const defaultBalance = ethers.MaxUint256;

export async function createSignerAndFundBalance(
	root: BigNumberish,
	provider: ethers.BrowserProvider,
): Promise<ethers.Wallet> {
	const strPk = ethers.zeroPadValue(ethers.toBeHex(root), 32);
	const signer = new ethers.Wallet(strPk, provider);

	await setBalance(signer.address, defaultBalance);

	return signer;
}

// Since connect fucntion return BaseContract which does not has creation method functionallity
export function connectSigner(
	contract: ethers.Contract | ethers.BaseContract,
	user: ethers.Wallet | ethers.Signer,
) {
	return contract.connect(user) as ethers.Contract;
}

export { baseFixture } from "./baseFixture";
export { permit2RuntimeBytecode, permit2Address } from "./constants";
