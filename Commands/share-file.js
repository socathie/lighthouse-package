const Conf = require("conf");
const chalk = require("chalk");
const { addressValidator, isCID } = require("../Utils/util");
const ethers = require("ethers");

const config = new Conf();
const lighthouse = require("../Lighthouse");
const readInput = require("../Utils/readInput");

const sign_auth_message = async (publicKey, privateKey) => {
  const provider = new ethers.providers.JsonRpcProvider();
  const signer = new ethers.Wallet(privateKey, provider);
  const messageRequested = (await lighthouse.getAuthMessage(publicKey)).data.message;
  const signedMessage = await signer.signMessage(messageRequested);
  return signedMessage;
};

module.exports = {
  command: "share-file [cid] [address]",
  desc: "Share access to other user",
  handler: async function (argv) {
    if (argv.help) {
      console.log(
        "\r\nlighthouse-web3 share-file <cid> <address>\r\n" +
          chalk.green("Description: ") +
          "Share access to other user\r\n"
      );
    } else {
      try {
        if (!config.get("LIGHTHOUSE_GLOBAL_PUBLICKEY")) {
          throw new Error("Please import wallet first!");
        }

        // Get key
        options = {
          prompt: "Enter your password: ",
          silent: true,
          default: "",
        };
        const password = await readInput(options);
        const decryptedWallet = ethers.Wallet.fromEncryptedJsonSync(
          config.get("LIGHTHOUSE_GLOBAL_WALLET"),
          password.trim()
        );
        
        const signedMessage = await sign_auth_message(
          config.get("LIGHTHOUSE_GLOBAL_PUBLICKEY"),
          decryptedWallet.privateKey
        );

        const shareResponse = await lighthouse.shareFile(
          config.get("LIGHTHOUSE_GLOBAL_PUBLICKEY"),
          [argv.address],
          argv.cid,
          signedMessage
        );

        console.log(
          chalk.yellow("sharedTo: ") +
          chalk.white(shareResponse.data.shareTo) + "\r\n" + 
          chalk.yellow("cid: ") +
          chalk.white(shareResponse.data.cid)
        );
      } catch (error) {
        console.log(chalk.red(error.message));
      }
    }
  },
  builder: function (yargs) {
    yargs
      .option("a", {
        alias: "address",
        demandOption: true,
        describe: "user's Address",
        type: "string",
      })
      .option("c", {
        alias: "cid",
        demandOption: true,
        describe: "file CID",
        type: "string",
      })
      .help()
      .check((argv, options) => {
        // check if valid Address
        if (!addressValidator(argv.address)) {
          console.log(chalk.red("Invalid Address"));
          throw new Error("Invalid Address");
        }
        if (!isCID(argv.cid)) {
          console.log(chalk.red("Invalid CID"));
          throw new Error("Invalid CID");
        }
        return true;
      });
  },
};
