export default {
  ResourceTypes: {
    userPool: {
      Locator: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        AllowPublicSignups: {
          Label: 'Allow Public Signups',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.AdminCreateUserConfig.AllowAdminCreateUserOnly',
          Transformations: ['Not'],
        },
        AutoVerifyEmails: {
          Label: 'Auto-Verify Emails',
          Description: 'Automatically send email verification upon signup',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "@.Properties.AutoVerifiedAttributes[?(@ === 'email')]",
          Transformations: ['Boolean'],
        },
      },
      FacetSingletons: [
        'preSignup',
        'postConfirmation',
        'preAuthentication',
        'postAuthentication',
        'customMessage',
        'createAuthChallenge',
        'defineAuthChallenge',
        'preTokenGeneration',
        'userMigration',
        'verifyAuthChallengeResponse',
      ],
      DashboardProperties: {
        label: 'User Pool',
        paletteLabel: 'User Pool',
        paletteHint: 'Cognito User Pool',
        paletteResource: 'AWS::Cognito::UserPool',
        paletteInfo:
          'Use this resource type to manage user accounts for an application.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpool.html',
        inputs: 1,
        icon: 'userPool.svg',
        zIndex: -50,
        facetLabels: {
          preSignup: 'Pre Sign-up',
          postConfirmation: 'Post Confirmation',
          preAuthentication: 'Pre Authentication',
          postAuthentication: 'Post Authentication',
          customMessage: 'Custom Message',
          createAuthChallenge: 'Create Authentication Challenge',
          defineAuthChallenge: 'Define Authentication Challenge',
          preTokenGeneration: 'Pre Token Generation',
          userMigration: 'User Migration',
          verifyAuthChallengeResponse:
            'Verify Authentication Challenge Response',
        },
        info: 'Manages user accounts',
        deploymentProperties: {
          arn: 'arn:aws:cognito-idp:%{region}:%{awsAccountId}:userpool/%{physicalId}',
          arnLink:
            'https://%{region}.console.aws.amazon.com/cognito/users/?region=%{region}#/pool/%{physicalId}/details',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'Allow Public Signups',
              value: '%{SETTING:AllowPublicSignups|JSONStringify}',
            },
          ],
          consoleLinks: [
            {
              label: 'Users',
              type: 'link',
              href: 'https://%{region}.console.aws.amazon.com/cognito/users/?region=%{region}#/pool/%{physicalId}/users',
            },
            {
              label: 'Application Clients',
              type: 'link',
              href: 'https://%{region}.console.aws.amazon.com/cognito/users/?region=%{region}#/pool/%{physicalId}/clients',
            },
          ],
        },
      },
      DefaultReferences: [
        { USER_POOL_ID: { Ref: '%{resourceId}' } },
        { USER_POOL_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
      DefaultPermissions: {
        IAMCapable: [
          {
            Actions: [
              'cognito-idp:Admin*',
              'cognito-idp:DescribeIdentityProvider',
              'cognito-idp:DescribeResourceServer',
              'cognito-idp:DescribeUserPool',
              'cognito-idp:DescribeUserPoolClient',
              'cognito-idp:DescribeUserPoolDomain',
              'cognito-idp:GetGroup',
              'cognito-idp:ListGroups',
              'cognito-idp:ListUserPoolClients',
              'cognito-idp:ListUsers',
              'cognito-idp:ListUsersInGroup',
              'cognito-idp:UpdateGroup',
            ],
          },
        ],
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'preSignup',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.PreSignUp",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'postConfirmation',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.PostConfirmation",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'preAuthentication',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.PreAuthentication",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'postAuthentication',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.PostAuthentication",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'customMessage',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.CustomMessage",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'createAuthChallenge',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.CreateAuthChallenge",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'defineAuthChallenge',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.DefineAuthChallenge",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'preTokenGeneration',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.PreTokenGeneration",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'userMigration',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.UserMigration",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
    {
      SourceType: 'userPool',
      TargetType: 'function',
      FacetType: 'verifyAuthChallengeResponse',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPool')].Properties.LambdaConfig.VerifyAuthChallengeResponse",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
  ],
  PermissionTypes: {
    userPool: {
      Custom: {
        Actions: [
          'cognito-idp:Admin*',
          'cognito-idp:DescribeIdentityProvider',
          'cognito-idp:DescribeResourceServer',
          'cognito-idp:DescribeUserPool',
          'cognito-idp:DescribeUserPoolClient',
          'cognito-idp:DescribeUserPoolDomain',
          'cognito-idp:GetGroup',
          'cognito-idp:ListGroups',
          'cognito-idp:ListUserPoolClients',
          'cognito-idp:ListUsers',
          'cognito-idp:ListUsersInGroup',
          'cognito-idp:UpdateGroup',
        ],
        Resources: {
          WithDependency: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] },
          WithoutDependency: {
            'Fn::Sub': [
              'arn:${AWS::Partition}:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/${physicalName}',
              { physicalName: '%{physicalName}' },
            ],
          },
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'userPool' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::Cognito::UserPool',
            Properties: {
              AdminCreateUserConfig: {
                AllowAdminCreateUserOnly: '%{SETTING:AllowPublicSignups}',
              },
              AliasAttributes: ['email', 'preferred_username'],
              UserPoolName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(87)}',
              },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'userPool', Setting: 'AllowPublicSignups' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.AdminCreateUserConfig.AllowAdminCreateUserOnly',
          Transformations: ['Not'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'userPool',
        Setting: 'AutoVerifyEmails',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.Resources.%{resourceId}.Properties.AutoVerifiedAttributes',
          Template: 'email',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'userPool',
        Setting: 'AutoVerifyEmails',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.AutoVerifiedAttributes[?(@ === 'email')]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'preSignup',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PreSignUp',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'preSignup',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PreSignUp',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'postConfirmation',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PostConfirmation',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'postConfirmation',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PostConfirmation',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'preAuthentication',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PreAuthentication',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'preAuthentication',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PreAuthentication',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'postAuthentication',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PostAuthentication',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'postAuthentication',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PostAuthentication',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'customMessage',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.CustomMessage',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'customMessage',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.CustomMessage',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'createAuthChallenge',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.CreateAuthChallenge',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'createAuthChallenge',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.CreateAuthChallenge',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'defineAuthChallenge',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.DefineAuthChallenge',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'defineAuthChallenge',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.DefineAuthChallenge',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'preTokenGeneration',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PreTokenGeneration',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'preTokenGeneration',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.PreTokenGeneration',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'userMigration',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.UserMigration',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'userMigration',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.UserMigration',
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'verifyAuthChallengeResponse',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.VerifyAuthChallengeResponse',
          Template: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}Permission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'cognito-idp.amazonaws.com',
              Action: 'lambda:InvokeFunction',
              SourceArn: { 'Fn::GetAtt': ['%{sourceId}', 'Arn'] },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'userPool',
        TargetType: 'function',
        FacetType: 'verifyAuthChallengeResponse',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.LambdaConfig.VerifyAuthChallengeResponse',
        },
      ],
    },
  ],
};
