import { ethers } from "ethers";

export type TypeElement = Record<string, ethers.TypedDataField[]>;
export type SignerLike = ethers.Signer | ethers.Wallet;
export type WitnessValue = Record<string, unknown>;

export interface DomainOptions {
	chainId?: ethers.BigNumberish;
	verifyingContract?: string;
}

export interface PermitTransferFromArgs {
	permitted: TokenPermissions;
	spender: string;
	nonce: ethers.BigNumberish;
	deadline: ethers.BigNumberish;
}

export interface PermitWitnessTransferFromTypes {
	witnessType: ethers.TypedDataField;
	witnessSubTypes: TypeElement;
}

export interface TokenPermissions {
	token: string;
	amount: string | BigInt;
}

export interface Permit2ConstructorParams {
	signer?: SignerLike;
	domain?: DomainOptions;
}

export interface DomainOptionsAndSigner {
	domainOptions: DomainOptions | null | undefined;
	signer: SignerLike | null | undefined;
}

export interface DomainAndSigner {
	domain: ethers.TypedDataDomain;
	signer: SignerLike;
}

export class Permit2 {
	private domain: ethers.TypedDataDomain;
	private signer: SignerLike | null;

	/**
	 * @param options - default settings for Permit2 (signer / domain)
	 * Can be set after construction
	 */
	public constructor(options?: Permit2ConstructorParams) {
		if (!options) options = {};

		this.signer = options.signer ? options.signer : null;
		this.domain = options.domain
			? this.createDomain(options.domain)
			: this.getDefaultDomain();
	}

	/** @param signer - new default signer */
	public updateSigner(signer: SignerLike) {
		this.signer = signer;
	}

	/**
	 * @param privateKey - pk from which will be derived signer
	 * @returns new signer instance
	 */
	public updateSignerFromPrivateKey(privateKey: string) {
		this.signer = new ethers.Wallet(privateKey);
		return this.signer;
	}

	/**
	 *
	 * @param params - arguments to be signed
	 * @param signer - who will sign | if not passed - will be signed from this.signer
	 * @param domainOptions - domain if it different from this.domain
	 *
	 * @returns signature
	 */
	public async signPermitTransferFrom(
		params: PermitTransferFromArgs,
		domainOptions?: DomainOptions | null,
		signer?: SignerLike | null,
	): Promise<string> {
		const { domain, signer: permitSigner } = this.getDomainAndSigner({
			domainOptions,
			signer,
		});

		const types = {
			PermitTransferFrom: this.getDefaultTransferTypes(),
			TokenPermissions: this.getTokenPermissionsType(),
		};

		return await permitSigner.signTypedData(domain, types, params);
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
	public async signPermitWitnessTransferFrom(
		params: PermitTransferFromArgs,
		witnessValue: WitnessValue,
		witnessTypes: PermitWitnessTransferFromTypes,
		domainOptions?: DomainOptions | null,
		signer?: SignerLike | null,
	): Promise<string> {
		const { domain, signer: permitSigner } = this.getDomainAndSigner({
			domainOptions,
			signer,
		});

		const paramsToSign = {
			...params,
			...witnessValue,
		};

		const paramsTypes = this.getWitnessTransferFromTypes(witnessTypes);

		return await permitSigner.signTypedData(
			domain,
			paramsTypes,
			paramsToSign,
		);
	}

	/**
	 * @param domainOpt - options which will be changed in default domain
	 *
	 * domainOpt.chainId - if you use Permit2 in chain differed from ETH
	 * domainOpt.verifyingContract - if you use Permit2 in tests with another address
	 *
	 * @returns new domain
	 */
	public createDomain(domainOpt: DomainOptions): ethers.TypedDataDomain {
		if (domainOpt.chainId) {
			domainOpt.chainId = domainOpt.chainId.toString();
		}

		return { ...this.getDefaultDomain(), ...domainOpt };
	}

	/** Same with createDomain, but set default domain */
	public createAndSetDomain(
		domainOpt: DomainOptions,
	): ethers.TypedDataDomain {
		this.domain = this.createDomain(domainOpt);
		return this.domain;
	}

	/**
	 * @param witnessTypes.witnessTypes: additional arguments types to be signed,
	 * @param witnessTypes.witnessSubTypes: if witnessTypes has nested arguments with reference type (structs / array[n] / array[])
	 *
	 * @returns types for permitWitnessTransferFrom
	 */
	public getWitnessTransferFromTypes(
		witnessTypes: PermitWitnessTransferFromTypes,
	): TypeElement {
		if (!witnessTypes.witnessSubTypes) {
			throw new Error(
				`You have not provided types for your witness value. At the moment, only structures are supported :(`,
			);
		}

		const PermitWitnessTransferFrom = [
			...this.getDefaultTransferTypes(),
			witnessTypes.witnessType,
		];

		const types = {
			PermitWitnessTransferFrom,
			TokenPermissions: this.getTokenPermissionsType(),
		};

		Object.assign(types, witnessTypes.witnessSubTypes);
		const encoder = ethers.TypedDataEncoder.from(types);

		return encoder.types;
	}

	/** @returns default domain for Permit2 in ETH */
	public getDefaultDomain(): ethers.TypedDataDomain {
		return {
			name: "Permit2",
			chainId: "1",
			verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
		};
	}

	/** @returns default types for permit...TransferFrom function args */
	public getDefaultTransferTypes(): ethers.TypedDataField[] {
		return [
			{ type: "TokenPermissions", name: "permitted" },
			{ type: "address", name: "spender" },
			{ type: "uint256", name: "nonce" },
			{ type: "uint256", name: "deadline" },
		];
	}

	/** @returns types for TokenPermissions struct */
	public getTokenPermissionsType(): ethers.TypedDataField[] {
		return [
			{ type: "address", name: "token" },
			{ type: "uint256", name: "amount" },
		];
	}

	private getDomainAndSigner({
		domainOptions,
		signer,
	}: DomainOptionsAndSigner): DomainAndSigner {
		if (!signer) {
			if (this.signer) {
				signer = this.signer;
			} else throw new Error("Signer is not defined");
		}
		const domain = domainOptions
			? this.createDomain(domainOptions)
			: this.domain;

		return { domain, signer };
	}

	/** @returns current domain */
	public get getDomain(): ethers.TypedDataDomain {
		return this.domain;
	}

	/** @returns current signer */
	public get getSigner(): SignerLike | null {
		return this.signer;
	}
}
