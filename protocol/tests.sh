#!/bin/bash
set -e

e2e_tests=(
    "init"
    # "token"
    "invoke"
    "init-lp-pool"
    "mint"
)

# currenty, there are no unit tests 
# cargo test

# build protocol before run test
./build.sh

for test_cmd in "${e2e_tests[@]}"
do
    npm run "test:$test_cmd"
done