#!/bin/bash
set -e

branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
# on master, every test should pass
if [ "$branch" == "master" ]
then
    npm run truffle -- test
# on every other branch, the code should at least compile
else
    npm run truffle -- compile
fi