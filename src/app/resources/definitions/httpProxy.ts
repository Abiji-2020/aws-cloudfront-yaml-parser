export default {
  ResourceTypes: {
    httpProxy: {
      IsVirtualEventTarget: true,
      Locator:
        "$.Resources[?(@.Type === 'AWS::AppSync::DataSource' && @.Properties.Type === 'HTTP')]",
      Settings: {
        Host: {
          Label: 'Host',
          ValueType: 'string',
          InputType: 'input',
          Default: 'https://api.example.com',
          IsConfigurable: true,
          Path: '@.Properties.HttpConfig.Endpoint',
        },
      },
      DashboardProperties: {
        label: 'HTTP Proxy Endpoint',
        paletteLabel: 'HTTP Proxy Endpoint',
        paletteInfo:
          'Use this resource type to proxy AppSync GraphQL queries to a REST Api.',
        paletteResource: 'AWS::AppSync::GraphQLApi',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-graphqlapi.html',
        inputs: 1,
        icon: 'graphql-proxy.svg',
        info: 'Proxies AppSync GraphQL queries to a REST Api',
        deploymentProperties: {
          settings: [{ label: 'Host', value: '%{SETTING:Host}' }],
        },
      },
    },
  },
  Reactions: [
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpProxy', Setting: 'Host' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.HttpConfig.Endpoint',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Name',
          Transformations: ['HttpProxyNameEscape'],
        },
      ],
    },
  ],
};
