import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';

const serverlessConfiguration: AWS = {
  service: 'pray4u-backend',

  frameworkVersion: '3',

  plugins: ['serverless-bundle'],

  package: { individually: true },

  custom: {
    stage: '${opt:stage, self:provider.stage}',
    tables: {
      event: {
        name: '${self:service}-${self:custom.stage}-event',
      },
    },
    cognito: {
      userPool: {
        name: '${self:service}-${self:custom.stage}-user-pool',
        client: '${self:service}-${self:custom.stage}-user-pool-client',
      },
      identityPool: {
        name: '${self:service}-${self:custom.stage}-identity-pool',
      },
    },
  },

  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'us-east-1',
    stage: 'prod',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
  },

  // import the function via paths
  functions: { hello },

  resources: {
    Resources: {

      notesTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          TableName: '${self:custom.tables.event.name}',
          AttributeDefinitions: [
            {
              AttributeName: 'eventType',
              AttributeType: 'S',
            },
            {
              AttributeName: 'eventId',
              AttributeType: 'S',
            },
          ],
          KeySchema: [
            {
              AttributeName: 'eventType',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'eventId',
              KeyType: 'RANGE',
            },
          ],
          BillingMode: 'PAY_PER_REQUEST',
        },
      },

      textBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD',
                ],
                MaxAge: 3000,
              },
            ],
          },
        },
      },

      audioBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD',
                ],
                MaxAge: 3000,
              },
            ],
          },
        },
      },

      videoBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                AllowedMethods: [
                  'GET',
                  'PUT',
                  'POST',
                  'DELETE',
                  'HEAD',
                ],
                MaxAge: 3000,
              },
            ],
          },
        },
      },

      cognitoUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: '${self:custom.cognito.userPool.name}',
          UsernameAttributes: ['email'],
          AutoVerifiedAttributes: ['email'],
        },
      },

      cognitoUserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          ClientName: '${self:custom.cognito.userPool.client}',
          UserPoolId: {
            Ref: 'cognitoUserPool',
          },
          ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH'],
          GenerateSecret: false,
        },
      },

      cognitoIdentityPool: {
        Type: 'AWS::Cognito::IdentityPool',
        Properties: {
          IdentityPoolName: '${self:custom.cognito.identityPool.name}',
          AllowUnauthenticatedIdentities: false,
          CognitoIdentityProviders: [
            {
              ClientId: {
                Ref: 'cognitoUserPoolClient',
              },
              ProviderName: {
                'Fn::GetAtt': ['cognitoUserPool', 'ProviderName'],
              },
            },
          ],
        },
      },

      cognitoIdentityPoolRoles: {
        Type: 'AWS::Cognito::IdentityPoolRoleAttachment',
        Properties: {
          IdentityPoolId: {
            Ref: 'cognitoIdentityPool',
          },
          Roles: {
            authenticated: {
              'Fn::GetAtt': ['cognitoAuthRole', 'Arn'],
            },
          },
        },
      },

      cognitoAuthRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          Path: '/',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Federated: 'cognito-identity.amazonaws.com',
                },
                Action: ['sts:AssumeRoleWithWebIdentity'],
                Condition: {
                  StringEquals: {
                    'cognito-identity.amazonaws.com:aud': {
                      Ref: 'cognitoIdentityPool',
                    },
                  },
                  'ForAnyValue:StringLike': {
                    'cognito-identity.amazonaws.com:amr': 'authenticated',
                  },
                },
              },
            ],
          },
          Policies: [
            {
              PolicyName: 'CognitoAuthorizedPolicy',
              PolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'cognito-sync:*',
                      'cognito-identity:*',
                    ],
                    Resource: '*',
                  },
                  {
                    Effect: 'Allow',
                    Action: ['execute-api:Invoke'],
                    Resource: {
                      'Fn::Join': [
                        '',
                        [
                          'arn:aws:execute-api:',
                          {
                            Ref: 'AWS::Region',
                          },
                          ':',
                          {
                            Ref: 'AWS::AccountId',
                          },
                          ':',
                          {
                            Ref: 'ApiGatewayRestApi'
                          },
                          '/*',
                        ],
                      ],
                    },
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:*'],
                    Resource: {
                      'Fn::Join': [
                        '',
                        [
                          {
                            'Fn::GetAtt': ['textBucket', 'Arn'],
                          },
                          '/private/',
                          '$',
                          '{cognito-identity.amazonaws.com:sub}/*',
                        ],
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },

    },

    Outputs: {
      textBucketName: {
        Value: {
          Ref: 'textBucket'
        },
      },
      audioBucketName: {
        Value: {
          Ref: 'audioBucket'
        },
      },
      videoBucketName: {
        Value: {
          Ref: 'videoBucket'
        },
      },
      userPoolId: {
        Value: {
          Ref: 'cognitoUserPool',
        },
      },
      userPoolClientId: {
        Value: {
          Ref: 'cognitoUserPoolClient',
        },
      },
      identityPoolId: {
        Value: {
          Ref: 'cognitoIdentityPool',
        },
      },
    },
  },

};

module.exports = serverlessConfiguration;
