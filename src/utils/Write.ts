import path from "path";
import fs from "fs";

export function writeObject(obj: any, dir: string) {
  /* Escreve um objeto qualquer como um arquivo json
  no diretório passado */

  const target = path.resolve(dir);
  const jsonString = JSON.stringify(obj, null, 2); // `null, 2` adds indentation for readability

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, jsonString);

  console.log();
  console.log(`Ecrito em ${path}: `);
  console.log(obj);
  console.log();
}
