#!/usr/bin/env bash
thrift  -out app/model/thrift --gen js:node ../../UrsaMajor/Dubhe/src/main/thrift/passport.thrift