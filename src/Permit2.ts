import { ethers } from "ethers";

type TransferFromTypes = Record<string, ethers.TypedDataField[]>;

type PermitSigner = ethers.Signer | ethers.Wallet;

interface DomainOptions {
	chainId?: string | number | ethers.BigNumberish;
	verifyingContract?: string;
}

interface TransferFromArgs {
	permitted: TokenPermissions;
	spender: string;
	nonce: number | string | BigInt;
	deadline: number | string | BigInt;
}

interface TokenPermissions {
	token: string;
	amount: string | BigInt;
}

interface Permit2OptionalParams {
	signer?: PermitSigner;
	domain?: DomainOptions;
}

class Permit2 {
	domain: ethers.TypedDataDomain;
	signer: PermitSigner | null;

	constructor(options?: Permit2OptionalParams) {
		if (!options) options = {};

		this.signer = options.signer ? options.signer : null;
		this.domain = options.domain
			? this.createDomain(options.domain)
			: this.getDefaultDomain();
	}

	async signPermitTransferFrom(
		params: TransferFromArgs,
		signer?: PermitSigner | null,
		domainOptions?: DomainOptions | null,
	): Promise<string> {
		let domain = domainOptions
			? this.createDomain(domainOptions)
			: this.domain;
		signer = signer ? signer : this.signer;

		if (!signer) throw new Error("Signer is not defined");

		return await signer.signTypedData(
			domain,
			this.getTransferFromTypes(),
			params,
		);
	}

	createDomain(domain: DomainOptions): ethers.TypedDataDomain {
		if (domain.chainId && typeof domain.chainId !== "string") {
			domain.chainId = domain.chainId.toString();
		}

		return { ...this.getDefaultDomain(), ...domain };
	}

	getDefaultDomain(): ethers.TypedDataDomain {
		return {
			name: "Permit2",
			chainId: "1",
			verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
		};
	}

	createSigner(privateKey: string, provider?: ethers.Provider) {
		this.signer = new ethers.Wallet(privateKey, provider);
		return this.signer;
	}

	updateSigner(signer: PermitSigner) {
		this.signer = signer;
	}

	getTransferFromTypes(): TransferFromTypes {
		return {
			PermitTransferFrom: [
				{ type: "TokenPermissions", name: "permitted" },
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "nonce" },
				{ type: "uint256", name: "deadline" },
			],
			TokenPermissions: [
				{ type: "address", name: "token" },
				{ type: "uint256", name: "amount" },
			],
		};
	}
}

export { Permit2 };
