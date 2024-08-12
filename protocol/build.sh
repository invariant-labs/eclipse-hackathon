

# Define the keypair JSON content
protocol='[125,25,103,8,46,252,74,11,10,231,221,13,113,82,123,17,118,205,218,140,247,37,159,150,140,109,50,158,185,90,57,107,244,112,134,82,19,192,92,70,188,247,227,156,239,127,119,76,193,85,143,146,12,43,48,189,79,193,48,21,49,108,226,209]'
puppet='[51,155,154,107,110,131,244,50,197,81,99,152,71,175,210,224,80,66,26,119,45,91,107,252,7,64,94,239,6,209,249,114,30,90,202,122,203,133,109,126,97,16,179,156,79,250,190,92,149,86,98,253,100,145,117,244,93,225,240,192,20,135,163,104]'

# Write the keypair JSON to file
echo "$protocol" > target/deploy/protocol-keypair.json
echo "$puppet" > target/deploy/puppet-keypair.json

# Build the program using Anchor
npm run prebuild
anchor build

# Navigate to the SDK directory
cd sdk

# Build the SDK
npm run build