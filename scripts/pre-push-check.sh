#!/bin/bash
set -e

branch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
# on master, every test should pass on push
if [ "$branch" == "master" ]
then
    npm run truffle -- test
fi