
import path from 'path';

import fs from 'fs';

export function writeObject(obj: any, dir: string) {

  const jsonString = JSON.stringify(obj, null, 2); // `null, 2` adds indentation for readability

  fs.writeFile(path.resolve(dir), jsonString, (err) => { if (err) throw err });

  console.log();
  console.log(`Ecrito em ${path}: `);
  console.log(obj);
  console.log();
}
