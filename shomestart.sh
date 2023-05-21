#!/bin/bash
d=$(date '+%Y-%m-%d_%H_%M_%S')
echo 'S-HO.ME service starting' >> $d.log
node lib/index.js | tee $d.log