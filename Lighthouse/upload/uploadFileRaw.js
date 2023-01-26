const axios = require("axios");
const lighthouseConfig = require("../../lighthouse.config");
/*
  This function is used to deploy a file to the Lighthouse server.
  It takes the following parameters:
  @param {string} sourcePath - The path of file/folder.
  @param {string} apiKey - The api key of the user.
*/

module.exports = async (sourcePath, apiKey) => {
  const fs = eval("require")("fs");
  const mime = eval("require")('mime-types');
  const NodeFormData = eval("require")("form-data");
  const token = "Bearer " + apiKey;
  
  try {
    const endpoint = lighthouseConfig.lighthouseNode + "/api/v0/add";
    const stats = fs.lstatSync(sourcePath);

    if (stats.isFile()) {
      //we need to create a single read stream instead of reading the directory recursively
      const data = new NodeFormData();
      const mimeType = mime.lookup(sourcePath);

      data.append("file", fs.createReadStream(sourcePath));

      const response = await axios.post(endpoint, data, {
        withCredentials: true,
        maxContentLength: "Infinity", //this is needed to prevent axios from erroring out with large directories
        maxBodyLength: "Infinity",
        headers: {
          "Content-type": `multipart/form-data; boundary= ${data._boundary}`,
          "Encryption": false,
          "Mime-Type": mimeType,
          Authorization: token,
        },
        params: {
          "cid-version": 1,
        },
      });

      return {data: response.data};
    } else {
      throw new Error("Only single file can be uploaded as raw buffer.")
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
