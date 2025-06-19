#!/bin/bash
set -e

MDA_FILE="$1"
MENDIX_VERSION="$2"
JAVA_PATH="$3"
WORKSPACE="$4"

rm -rf project var tmp bin

mkdir project
unzip -qq "$MDA_FILE" -d project
cp configs/e2e/m2ee-native.yml project/m2ee-native.yml
sed -i -- "s=\$ROOT_PATH=$WORKSPACE=g" project/m2ee-native.yml
sed -i -- "s=\$JAVA_HOME=$JAVA_PATH=g" project/m2ee-native.yml

mkdir -p var/log var/opt/m2ee var/run bin tmp
git clone https://github.com/KevinVlaanderen/m2ee-tools.git tmp/m2ee
mv tmp/m2ee/src/* var/opt/m2ee
chmod a=rwx var/log/ var/run/
echo "#!/bin/bash -x" > bin/m2ee
echo "python3 var/opt/m2ee/m2ee.py \$@" >>bin/m2ee
chmod +x bin/m2ee

mkdir -p "$WORKSPACE/project/runtimes" "$WORKSPACE/project/data/model-upload" "$WORKSPACE/project/data/database" "$WORKSPACE/project/data/files" "$WORKSPACE/project/data/tmp"
wget -q "https://cdn.mendix.com/runtime/mendix-$MENDIX_VERSION.tar.gz" -O tmp/runtime.tar.gz
tar xfz tmp/runtime.tar.gz --directory "$WORKSPACE/project/runtimes"
rm tmp/runtime.tar.gz