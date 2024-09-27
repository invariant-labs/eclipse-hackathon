#!/bin/bash
set -e

e2e_tests=(
    "math"
    "init"
    "init-lp-pool"
    "burn"
    "mint-high-tick-big"
    "mint-high-tick-small"
    "mint-zero-tick-big"
    "mint-zero-tick-small"
    "multi-pool"
)

# currenty, there are no unit tests 
cargo test

# build protocol before run test
./build.sh

for test_cmd in "${e2e_tests[@]}"
do
    npm run "test:$test_cmd"
done