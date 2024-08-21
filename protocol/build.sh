set -e

# Define the keypair JSON content
protocol='[205,139,58,204,175,105,197,126,88,143,149,212,209,29,81,79,174,212,111,79,72,98,35,239,55,220,147,226,220,165,118,94,214,232,12,140,194,77,237,168,209,101,215,241,207,7,81,218,9,16,112,232,99,99,175,167,174,138,64,250,128,239,50,167]'
invarinat='[100,94,104,217,253,66,112,71,155,206,9,70,30,6,93,185,82,49,169,250,96,24,120,234,25,145,148,106,134,60,55,123,176,93,3,185,31,73,255,255,107,72,82,123,112,9,31,16,214,15,171,107,164,37,143,208,35,195,133,157,224,137,246,197]'

# Write the keypair JSON to file
mkdir -p target/deploy
echo "$protocol" > target/deploy/protocol-keypair.json
echo "$invarinat" > target/deploy/invariant-keypair.json

# Build the program using Anchor
anchor build

# Navigate to the SDK directory
cd sdk

# Build the SDK
npm run build