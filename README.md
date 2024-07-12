### Installation
To run the application you need to have installed Node.js and npm.  Also you need to install the modules of pose tracking engines:
```bash
$ npm install --legacy-peer-deps @tensorflow/tfjs @tensorflow-models/posenet

$ npm install --legacy-peer-deps @tensorflow/tfjs-converter

$ npm install --legacy-peer-deps

```
that npm commands will  install the @tensorflow-models/pose-detection library into the but also tfjs-converter and webgl dependencies, needed to run the @tensorflow-models/pose-detection library. 

```bash
npm run install-pose-runtimes
```

That npm script will also install the @mediapipe/pose library into the _public/vendor/@mediapipe/_ directory and will make a link named _pose_ to the installed version. The version installed can be changed in the npm script contained in the _package.json_ file; the selected version should match the one used in the _dependencies_ section of the file for the _@mediapipe/pose_ entry.

### Start development server:

```bash
npm start
```

## Project Structure

```bash
    .
    ├── public/  # The final directory where all assets are added and also where the final bundle.js will be store
    │   ├── assets/  # Add here all the assets related to your application
    │   ├── vendor/  # All the external scripts that shouldn't be compiled; mostly to hold the @mediapipe/pose WASM runtimes
    │   ├── index.html  # The base HTML file
    ├──src/  # All the TypeScript files that comprise your application
    │   ├── factories/  # Factories to create objects
    │   ├── gameobjects/  # Custom game objects
    │   ├── modals/  # stats and historical data modals
    │   ├── pose-tracker-engine/  # Directory holding all the @mediapipe/pose wrappers and utilities made for the application    
    │   ├── scenes/  # All the scenes of the application
    │   ├── types/  # Global interfaces, enums, types, etc
    |   ├── workouts/  # Specific workout logic
    │   ├── main.ts  # The main TS file that will be executed when the application runs
    ├── package.json  # The file with the build script and the dependencies
```

TypeScript files are intended to be in the `src/` folder. `main.ts` is the entry point to build the `bundle.js` file
referenced by `index.html`; that file will be copied to the `public/` directory on every build along with its source
maps (if development environment).


## Technological stack

The technological stack includes:

- **phaser** as development framework.
- **@mediapipe/pose** and **@tensorflow/posenet** for all the skeleton tracking stuff.
- **typescript** for not going mad without types.
- **esbuild** for bundling/transpile TypeScript files to JavaScript.
- **browsersync** for reloading the dev server on every file changes.
- **prettier** to format source files homogeneously.
- **eslint** to check/fix errors in the code.
