import type { AWS } from '@serverless/typescript';

import hello from '@functions/hello';

const serverlessConfiguration: AWS = {
  service: 'pray4u-backend',

  frameworkVersion: '3',

  variablesResolutionMode: '20210326',

  plugins: [
    'serverless-bundle',
    'serverless-domain-manager',
    'serverless-stack-output',
  ],

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
    customDomain: {
      domainName: 'api.dev.pray4u.org',
      basePath: '${self:custom.stage}',
      stage: '${self:custom.stage}',
      createRoute53Record: true,
      endpointType: 'regional',
      securityPolicy: 'tls_1_2',
      apiType: 'rest',
      autoDomain: false,
    },
    output: {
      file: 'integration/${self:custom.stage}-stack-output.json',
    },
    bundle: {
      packager: 'yarn',
      excludeFiles: '**/*.spec.ts',
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
          SupportedIdentityProviders: [
            'COGNITO',
            'Google',
          ],
          CallbackURLs: [
            'http://localhost:3000',
          ],
          LogoutURLs: [
            'http://localhost:3000',
          ],
          AllowedOAuthFlows: [
            'code',
            'implicit',
          ],
          AllowedOAuthScopes: [
            'profile',
            'email',
            'openid',
          ],
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
          SupportedLoginProviders: {
            "accounts.google.com": "344279965332-4cma6kuef2essduetjc4mb19dpr5663b.apps.googleusercontent.com",
          },
        },
      },

      googleIdentityProvider: {
        Type: 'AWS::Cognito::UserPoolIdentityProvider',
        Properties: {
          UserPoolId: {
            Ref: 'cognitoUserPool',
          },
          ProviderName: 'Google',
          ProviderDetails: {
            client_id: '344279965332-4cma6kuef2essduetjc4mb19dpr5663b.apps.googleusercontent.com',
            client_secret: '${ssm:/Google_Pray4uWebApp_OAuth_Client_Key}',
            authorize_scopes: 'profile email openid',
          },
          ProviderType: 'Google',
          AttributeMapping: {
            email: 'email',
            email_verified: 'email_verified',
          },
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

      gatewayResponseDefault4XX: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          ResponseParameters: {
            'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
            'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
          },
          ResponseType: 'DEFAULT_4XX',
          RestApiId: {
            Ref: 'ApiGatewayRestApi',
          },
        },
      },

      gatewayResponseDefault5XX: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          ResponseParameters: {
            'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
            'gatewayresponse.header.Access-Control-Allow-Headers': "'*'",
          },
          ResponseType: 'DEFAULT_5XX',
          RestApiId: {
            Ref: 'ApiGatewayRestApi',
          },
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
      region: {
        Value: '${self:provider.region}',
      },
    },
  },

};

module.exports = serverlessConfiguration;
