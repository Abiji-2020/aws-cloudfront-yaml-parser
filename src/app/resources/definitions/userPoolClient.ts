export default {
  ResourceTypes: {
    userPoolClient: {
      Locator: "$.Resources[?(@.Type === 'AWS::Cognito::UserPoolClient')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
      },
      DashboardProperties: {
        label: 'User Pool Client',
        paletteLabel: 'User Pool Client',
        paletteHint: 'Cognito User Pool Client',
        paletteResource: 'AWS::Cognito::UserPoolClient',
        paletteInfo:
          'Use this resource type to generate authentication tokens for user accounts for an application.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cognito-userpoolclient.html',
        inputs: 1,
        outputs: 1,
        icon: 'userPool.svg',
        info: 'Manages user authentication',
        deploymentProperties: { settings: [], consoleLinks: [] },
      },
      DefaultReferences: [{ USER_POOL_CLIENT_ID: { Ref: '%{resourceId}' } }],
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'userPoolClient',
      TargetType: 'userPool',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Cognito::UserPoolClient')].Properties.UserPoolId",
        Source: { Index: 2 },
        Target: { Path: '@' },
      },
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'userPoolClient' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: { Type: 'AWS::Cognito::UserPoolClient' },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'userPoolClient', TargetType: 'userPool' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}.Properties.UserPoolId',
          Template: { Ref: '%{targetId}' },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::Serverless::HttpApi')].Properties.Auth.Authorizers[?(@.JwtConfiguration.audience[0].Ref === '%{sourceId}')].JwtConfiguration.issuer",
          Template: {
            'Fn::Sub':
              'https://cognito-idp.${AWS::Region}.amazonaws.com/${%{targetId}}',
          },
          CreatePath: false,
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'userPoolClient', TargetType: 'userPool' },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{sourceId}.Properties.UserPoolId',
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::Serverless::HttpApi')].Properties.Auth.Authorizers[?(@.JwtConfiguration.audience[0].Ref === '%{sourceId}')].JwtConfiguration.issuer",
        },
      ],
    },
  ],
};
