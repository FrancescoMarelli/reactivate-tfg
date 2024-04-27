#!/usr/bin/env bash

function usage() {
  if [ -n "$1" ]; then echo -e "Error: $1\n" 1>&2; fi
  echo "Installs a version of TensorFlow.js and PoseNet runtime easily without having to update the application paths manually"
  echo "Usage: $(basename "$0") [--latest|-v,--version <version>]"
  echo "  --latest              Install the latest version of TensorFlow.js and PoseNet"
  echo "  -v, --version         Install a specific version"
  echo "  -h, --help            This help"
  echo ""
  echo "Example: $0 --latest"
  exit 1
}

if [ $# -lt 1 ]; then usage "At least one argument is required."; fi

if [ -x "$(command -v apt-get)" ]; then
  # We are in a debian-based linux, so install the required dependencies without complaining
  apt-get update && apt-get install -y curl
fi

if ! [ -x "$(command -v curl)" ]; then
  echo 'Error: curl is required to run this program.' >&2
  exit 1
fi

while [ $# -gt 0 ]; do case $1 in
  --latest)
    tf_version=$(curl -s "https://data.jsdelivr.com/v1/package/npm/@tensorflow/tfjs" | grep -oP '(?<="version":")[^"]+' | head -n1)
    posenet_version=$(curl -s "https://data.jsdelivr.com/v1/package/npm/@tensorflow-models/posenet" | grep -oP '(?<="version":")[^"]+' | head -n1)
    shift;;
  -v|--version)
    tf_version="$2"
    posenet_version="$2"
    shift;shift;;
  -h|--help) usage;shift;shift;;
  *) usage "Unknown parameter passed: $1";shift;shift;;
esac; done

# Install TensorFlow.js
if [ $(curl -s https://data.jsdelivr.com/v1/package/resolve/npm/@tensorflow/tfjs@${tf_version} | grep -oP '(?<="version":")[^"]+' | head -n1) != "$tf_version" ]; then
  echo "TensorFlow.js version $tf_version doesn't exist"
  exit 1
fi

mkdir -p "public/vendor/@tensorflow/tfjs@${tf_version}"
pushd public/vendor/@tensorflow > /dev/null

tf_files=("tf-core.es2017.js" "tf-backend-webgl.es2017.js")
for tf_file in "${tf_files[@]}"; do
  curl -s https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@${tf_version}/dist/${tf_file} -o "tfjs@${tf_version}/$tf_file"
  echo "Downloaded @tensorflow/tfjs-core@${tf_version}/dist/${tf_file}"
done
rm -f tfjs && ln -sv "tfjs@${tf_version}" tfjs

popd > /dev/null

# Install PoseNet
if [ $(curl -s https://data.jsdelivr.com/v1/package/resolve/npm/@tensorflow-models/posenet@${posenet_version} | grep -oP '(?<="version":")[^"]+' | head -n1) != "$posenet_version" ]; then
  echo "PoseNet version $posenet_version doesn't exist"
  exit 1
fi

mkdir -p "public/vendor/@tensorflow-models/posenet@${posenet_version}"
pushd public/vendor/@tensorflow-models > /dev/null

posenet_files=("posenet.min.js" "posenet.min.js.map")
for posenet_file in "${posenet_files[@]}"; do
  curl -s https://cdn.jsdelivr.net/npm/@tensorflow-models/posenet@${posenet_version}/${posenet_file} -o "posenet@${posenet_version}/$posenet_file"
  echo "Downloaded @tensorflow-models/posenet@${posenet_version}/${posenet_file}"
done
rm -f posenet && ln -sv "posenet@${posenet_version}" posenet

popd > /dev/null
