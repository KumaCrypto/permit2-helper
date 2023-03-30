import { ethers } from "ethers";

type TypeElement = Record<string, ethers.TypedDataField[]>;

type PermitSigner = ethers.Signer | ethers.Wallet;

interface DomainOptions {
	chainId?: ethers.BigNumberish;
	verifyingContract?: string;
}

interface PermitTransferFromArgs {
	permitted: TokenPermissions;
	spender: string;
	nonce: ethers.BigNumberish;
	deadline: ethers.BigNumberish;
}

interface PermitWitnessTransferFromTypes {
	witnessTypes: ethers.TypedDataField[];
	witnessSubTypes?: TypeElement;
}

interface PermitWitnessTransferFromArgs extends PermitTransferFromArgs {
	witnessValue: Record<string, any>;
}

interface TokenPermissions {
	token: string;
	amount: string | BigInt;
}

interface Permit2ConstructorParams {
	signer?: PermitSigner;
	domain?: DomainOptions;
}

class Permit2 {
	domain: ethers.TypedDataDomain;
	signer: PermitSigner | null;

	/**
	 * @param options - default settings for Permit2 (signer / domain)
	 * Can be setted after construction
	 */
	constructor(options?: Permit2ConstructorParams) {
		if (!options) options = {};

		this.signer = options.signer ? options.signer : null;
		this.domain = options.domain
			? this.createDomain(options.domain)
			: this.getDefaultDomain();
	}

	/**
	 *
	 * @param params - arguments to be signed
	 * @param signer - who will sign | if not passed - will be signed from this.signer
	 * @param domainOptions - domain if it different from this.domain
	 *
	 * @returns signature
	 */
	async signPermitTransferFrom(
		params: PermitTransferFromArgs,
		signer?: PermitSigner | null,
		domainOptions?: DomainOptions | null,
	): Promise<string> {
		let domain = domainOptions
			? this.createDomain(domainOptions)
			: this.domain;
		signer = signer ? signer : this.signer;

		if (!signer) throw new Error("Signer is not defined");

		const types = {
			PermitTransferFrom: this.getDefaultTransferTypes(),
			TokenPermissions: this.getTokenPermissionsType(),
		};

		return await signer.signTypedData(domain, types, params);
	}

	/**
	 *
	 * @param params - arguments to be signed
	 * @param witnessTypes - added values types
	 * @param signer - who will sign
	 * @param domainOptions - domain if it different from this.domain
	 *
	 * @returns signature
	 */
	async signPermitWitnessTransferFrom(
		params: PermitWitnessTransferFromArgs,
		witnessTypes: PermitWitnessTransferFromTypes,
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
			this.getWitnessTransferFromTypes(witnessTypes),
			params,
		);
	}

	/**
	 * @param domainOpt - options which will be changed in default domain
	 *
	 * domainOpt.chainId - if you use Permit2 in chain deffered from ETH
	 * domainOpt.verifyingContract - if you use Permit2 in tests with another address
	 *
	 * @returns new domain
	 */
	createDomain(domainOpt: DomainOptions): ethers.TypedDataDomain {
		if (domainOpt.chainId) {
			domainOpt.chainId = domainOpt.chainId.toString();
		}

		return { ...this.getDefaultDomain(), ...domainOpt };
	}

	/** Same with createDomain, but set default domain */
	createAndSetDomain(domainOpt: DomainOptions): ethers.TypedDataDomain {
		this.domain = this.createDomain(domainOpt);
		return this.domain;
	}

	/** @param signer - new default signer */
	updateSigner(signer: PermitSigner) {
		this.signer = signer;
	}

	/**
	 * @param privateKey - pk from which will be derived signer
	 * @returns new signer instance
	 */
	updateSignerFromPrivateKey(privateKey: string) {
		this.signer = new ethers.Wallet(privateKey);
		return this.signer;
	}

	/**
	 * @param witnessTypes.witnessTypes: additional arguments types to be signed,
	 * @param witnessTypes.witnessSubTypes: if witnessTypes has nested arguments with referece type (structs / array[n] / array[])
	 *
	 * @returns types for permitWitnessTransferFrom
	 */
	getWitnessTransferFromTypes(
		witnessTypes: PermitWitnessTransferFromTypes,
	): TypeElement {
		const defaultTransferTypesWithWitness = {
			PermitWitnessTransferFrom: [
				...this.getDefaultTransferTypes(),
				...witnessTypes.witnessTypes,
			],
		};

		const encoder = ethers.TypedDataEncoder.from({
			...defaultTransferTypesWithWitness,
			...witnessTypes.witnessSubTypes,
			TokenPermissions: this.getTokenPermissionsType(),
		});

		return encoder.types;
	}

	/** @returns default domain for Permit2 in ETH */
	getDefaultDomain(): ethers.TypedDataDomain {
		return {
			name: "Permit2",
			chainId: "1",
			verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
		};
	}

	/** @returns default types for permit...TranferFrom function args */
	getDefaultTransferTypes(): ethers.TypedDataField[] {
		return [
			{ type: "TokenPermissions", name: "permitted" },
			{ type: "address", name: "spender" },
			{ type: "uint256", name: "nonce" },
			{ type: "uint256", name: "deadline" },
		];
	}

	/** @returns types for TokenPermissions struct */
	getTokenPermissionsType() {
		return [
			{ type: "address", name: "token" },
			{ type: "uint256", name: "amount" },
		];
	}
}

export { Permit2 };
