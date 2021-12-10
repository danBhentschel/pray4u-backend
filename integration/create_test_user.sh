#!/usr/bin/env bash

poolId=$(jq -r .userPoolId < integration/${SERVERLESS_STAGE}-stack-output.json)

aws cognito-idp admin-create-user \
  --user-pool-id $poolId \
  --username "$COGNITO_USERNAME" \
  --temporary-password "$COGNITO_PASSWORD" \
  --message-action SUPPRESS \
  --no-cli-pager

aws cognito-idp admin-set-user-password \
  --user-pool-id $poolId \
  --username "$COGNITO_USERNAME" \
  --password "$COGNITO_PASSWORD" \
  --permanent
