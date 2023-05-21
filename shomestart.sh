#!/bin/bash
d=$(date '+%Y-%m-%d_%H_%M_%ST%Z')
echo 'S-HO.ME service starting' >> logs/$d.log
node lib/index.js | tee logs/$d.log