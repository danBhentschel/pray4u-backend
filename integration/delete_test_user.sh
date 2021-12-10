#!/usr/bin/env bash

poolId=$(jq -r .userPoolId < integration/${SERVERLESS_STAGE}-stack-output.json)

aws cognito-idp admin-delete-user \
  --user-pool-id $poolId \
  --username "$COGNITO_USERNAME"
