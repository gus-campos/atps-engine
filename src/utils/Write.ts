
import path from 'path';

import fs from 'fs';

export function writeObject(obj: any, dir: string) {

  const jsonString = JSON.stringify(obj, null, 2); // `null, 2` adds indentation for readability

  fs.writeFileSync(path.resolve(dir), jsonString);

  console.log();
  console.log(`Ecrito em ${path}: `);
  console.log(obj);
  console.log();
}
