# Permit2-helper

## Overview

This library is designed to simplify interaction with the Uniswap Permit2 smart contract, which adds "permit" functionality to tokens that don't support it.

To learn more about why Permit2 was created and what its logic is:

-   [Permit2 source code](https://github.com/Uniswap/permit2)
-   [Good explanation of Create2](https://github.com/dragonfly-xyz/useful-solidity-patterns/tree/main/patterns/permit2)
-   [Create2 documentation from Uniswap](https://docs.uniswap.org/contracts/permit2/overview)

---

## Let's get started

1. First, you need to install the library:

```bash
npm install permit2-helper
```

2. Import the library at the beginning of your script:

```javascript
import { Permit2 } from "permit2-helper";
```

3. Create an instance of the class:

```javascript
/*
Constructor takes object of parameters, it's interface:
    interface Permit2ConstructorParams {
    	signer?: SignerLike;
    	domainOpt?: DomainOptions;
    }

    interface DomainOptions {
    	chainId?: ethers.BigNumberish;
    	verifyingContract?: string;
    }
*/
const permit2Helper = new Permit2({
	signer: YourSigner,
	domainOpt: { chaindId: YourChainId, verifyingContract: YourVerifier },
});
```

4. Call the function to sign the message (see below)

---

## signPermitTransferFrom & signPermitWitnessTransferFrom

---

You probably only need two functions:

### signPermitTransferFrom

signPermitTransferFrom args:

-   params: PermitTransferFromArgs, see code snippet
-   domainOptions?: DomainOptions | null, --> if you want to override default domain in class
-   signer?: SignerLike | null, --> if you want to override default signer in class

```javascript
/*
    interface PermitTransferFromArgs {
	    permitted: TokenPermissions; --> desired token and amount which you will approve to spender
	    spender: string; --> approve receiver
	    nonce: ethers.BigNumberish; --> your nonce for this approve
	    deadline: ethers.BigNumberish; --> block.timestamp when approve will expired
    }

    interface TokenPermissions {
	    token: string;
	    amount: string | BigInt;
    }
*/

const params: {
        permitted: {
            token: token.address,
            amount: 123456789
        },
	    spender: spender.address,
	    nonce: 123,
	    deadline: 123456789,
}

const signature = await permit2Helper.signPermitTransferFrom(params);
```

---

### signPermitWitnessTransferFrom

signPermitWitnessTransferFrom args:

-   params: PermitTransferFromArgs, --> same with signPermitTransferFrom
-   witnessValue: WitnessValue, --> your witness value (structure values)
-   witnessTypes: PermitWitnessTransferFromTypes, --> types for witness structure
-   domainOptions?: DomainOptions, --> same with signPermitTransferFrom
-   signer?: SignerLike --> same with signPermitTransferFrom

```javascript
/*
    === Interfaces:
    type WitnessValue = Record<string, unknown>;

    interface PermitWitnessTransferFromTypes {
	    witnessType: ethers.TypedDataField;
	    witnessSubTypes: TypeElement;
    }
    ===

    Solidity struct for example:
        struct Witness {
		    address user;
	    }
*/

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
```

---

> For more examples see tests

---

## Testing

```bash
cd ./test
npx hardhat test
```

---

# Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

---

# Author:

## [Vladimir Kumalagov](https://github.com/KumaCrypto)

---

# License

## [MIT](https://choosealicense.com/licenses/mit/)
