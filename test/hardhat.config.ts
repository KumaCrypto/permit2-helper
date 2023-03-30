import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
	solidity: "0.8.18",
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 1,
		},
	},
};

export default config;
