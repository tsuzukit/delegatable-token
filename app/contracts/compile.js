const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

compile = () => {

  console.log("Start compiling");

  let input = {};
  let folderName = 'src';
  fs.readdirSync(__dirname + '/' + folderName).forEach(file => {
    if (file.startsWith('.')) {
      return;
    }

    console.log("Compile file " + file);
    input[file] = fs.readFileSync(path.resolve(__dirname, folderName, file), 'utf8');
  });

  const compiledContract = solc.compile({sources: input}, 1).contracts;
  fs.ensureDirSync(buildPath);
  for (let contract in compiledContract) {
    fs.outputJsonSync(
      path.resolve(buildPath, contract.split(':').pop() + '.json'),
      compiledContract[contract]
    );
  }

  console.log("Compile finish");

};

compile();
