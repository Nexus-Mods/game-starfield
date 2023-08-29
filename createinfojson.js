import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//console.log("__dirname=" + __dirname);
//console.log("__filename=" + __filename);

async function start() {
  const distFolder = path.join(__dirname, "dist");

  const packageJsonPath = path.join(__dirname, "package.json");
  const infoJsonPath = path.join(distFolder, "info.json");

  let packageJson;

  // load package.json so we can get data
  try {
    const packageData = await fs.readFile(packageJsonPath, {
      encoding: "utf8",
    });
    packageJson = JSON.parse(packageData);
  } catch (error) {
    console.error(error);
  }

  // create vortex info.json object
  const infoJson = {
    name:
      packageJson?.config?.extensionName == undefined
        ? packageJson.name
        : packageJson?.config?.extensionName,
    author: packageJson.author,
    version: packageJson.version,
    description: packageJson.description,
  };

  // try to copy gameart.jpg

  const file = "gameart.jpg";
  const source = path.join(__dirname, file);
  const destination = path.join(distFolder, file);

  try {
    await fs.copyFile(source, destination);
    console.log(`${file} was copied to ${destination}`);
  } catch (error) {
    console.log(`The file could not be copied. ${error}`);
  }

  /*
  // try to load info.json if it exists
  try {
    await fs.access(infoJsonPath);
    console.log(infoJsonPath + " exists");

    const infoData = await fs.readFile(infoJsonPath, { encoding: "utf8" });
    infoJson = JSON.parse(infoData); // try to parse into object

    // exists, so only update the other stuff
    infoJson.author = packageJson.author;
    infoJson.version = packageJson.version;
    infoJson.description = packageJson.description;
  } catch (error) {
    console.error(error);

    // doesn't exist, update everything
    infoJson.name = packageJson.name;
    infoJson.author = packageJson.author;
    infoJson.version = packageJson.version;
    infoJson.description = packageJson.description;
  }*/

  // try to write created info.json to /dist folder

  try {
    const json = JSON.stringify(infoJson);

    console.log(json);
    console.log(new Date().toTimeString());

    // write back to info.json
    await fs.writeFile(infoJsonPath, json, { encoding: "utf8" });
  } catch (err) {
    console.error(err);
  }
}

start();
