import * as fs from "fs";
import { yamlParse, yamlDump } from "yaml-cfn";

function readFileSync(path: string): string {
  return fs.readFileSync(path, "utf8");
}

const filePath = "test.yaml";
const content = readFileSync(filePath);
const parsed = yamlParse(content);
fs.writeFileSync("tes.json", JSON.stringify(parsed));
