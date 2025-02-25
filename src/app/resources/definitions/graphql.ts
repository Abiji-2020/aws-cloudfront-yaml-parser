export default {
  ResourceTypes: {
    graphql: {
      Locator: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLApi')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        AuthenticationType: {
          Label: 'Authentication Type',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'API Key', Value: 'API_KEY' },
            { Label: 'AWS IAM Signatures', Value: 'AWS_IAM' },
            {
              Label: 'AWS Cognito User Pool',
              Value: 'AMAZON_COGNITO_USER_POOLS',
            },
            { Label: 'OpenID Connect', Value: 'OPENID_CONNECT' },
          ],
          Default: 'API_KEY',
          Path: '@.Properties.AuthenticationType',
        },
        CognitoUserPoolId: {
          Label: 'AWS Cognito User Pool Id',
          DependsOn: { AuthenticationType: 'AMAZON_COGNITO_USER_POOLS' },
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          Path: '@.Properties.UserPoolConfig.UserPoolId',
        },
        OpenIDConnectIssuer: {
          Label: 'OpenID Connect Issuer',
          DependsOn: { AuthenticationType: 'OPENID_CONNECT' },
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          Path: '@.Properties.OpenIDConnectConfig.Issuer',
        },
        FieldLogLevel: {
          Label: 'Field-Level Logging',
          ValueType: 'string',
          InputType: 'select',
          Choices: [
            { Label: 'All Queries', Value: 'ALL' },
            { Label: 'Erroring Queries', Value: 'ERROR' },
            { Label: 'None', Value: 'NONE' },
          ],
          Default: 'ERROR',
          Path: '@.Properties.LogConfig.FieldLogLevel',
        },
        SaveSchemaInFile: {
          OnlyFormats: ['SAM'],
          Label: 'Save Schema In File',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLSchema' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')].Properties.DefinitionS3Location",
          Transformations: ['IsLocalFile'],
        },
        SchemaLocation: {
          OnlyFormats: ['SAM'],
          DependsOn: { SaveSchemaInFile: true },
          Label: 'Schema File Location',
          ValueType: 'string',
          InputType: 'input',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLSchema' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')].Properties.DefinitionS3Location",
        },
        Schema: {
          Label: 'GraphQL Schema',
          ValueType: 'string',
          InputType: 'graphqlschema',
          Default:
            'schema {\n  query: Query\n  mutation: Mutation\n}\n\ntype Query\ntype Mutation',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLSchema' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')].Properties.Definition",
        },
        Resolvers: {
          Label: 'Attach Resolvers',
          Type: 'FacetResources',
          ValueType: 'array',
          Facets: {
            Setting: 'Schema',
            Transformations: ['GraphQLFieldChoices'],
          },
          Default: [],
          FacetType: 'field',
          FacetLocator:
            "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')]",
          FacetPropertyBindings: {
            Type: '@.Properties.TypeName',
            Field: '@.Properties.FieldName',
          },
        },
      },
      FacetSettings: {
        field: {
          SaveRequestMappingTemplateInFile: {
            OnlyFormats: ['SAM'],
            Label: 'Save Request Mapping Template In File',
            ValueType: 'boolean',
            InputType: 'checkbox',
            Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.RequestMappingTemplateS3Location",
            Transformations: ['IsLocalFile'],
          },
          RequestMappingTemplateLocation: {
            OnlyFormats: ['SAM'],
            DependsOn: { SaveRequestMappingTemplateInFile: true },
            Label: 'Request Mapping Template File Location',
            ValueType: 'string',
            InputType: 'input',
            Default: null,
            Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.RequestMappingTemplateS3Location",
          },
          RequestMappingTemplate: {
            Label: 'Request Mapping Template',
            ValueType: 'string',
            InputType: 'velocity',
            Default:
              '{\n  "version": "2017-02-28",\n  "payload": $util.parseJson($context.arguments.body)\n}',
            Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.RequestMappingTemplate",
          },
          SaveResponseMappingTemplateInFile: {
            OnlyFormats: ['SAM'],
            Label: 'Save Response Mapping Template In File',
            ValueType: 'boolean',
            InputType: 'checkbox',
            Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.ResponseMappingTemplateS3Location",
            Transformations: ['IsLocalFile'],
          },
          ResponseMappingTemplateLocation: {
            OnlyFormats: ['SAM'],
            DependsOn: { SaveResponseMappingTemplateInFile: true },
            Label: 'Response Mapping Template File Location',
            ValueType: 'string',
            InputType: 'input',
            Default: null,
            Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.ResponseMappingTemplateS3Location",
          },
          ResponseMappingTemplate: {
            Label: 'Response Mapping Template',
            ValueType: 'string',
            InputType: 'velocity',
            Default: '$utils.toJson($context.result)',
            Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.ResponseMappingTemplate",
          },
        },
      },
      DashboardProperties: {
        label: 'GraphQL Api',
        paletteLabel: 'GraphQL Api',
        paletteHint: 'AWS AppSync Api',
        paletteResource: 'AWS::AppSync::GraphQLApi',
        paletteInfo:
          'Use this resource type to declare a GraphQL Api backed by serverless resources.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-graphqlapi.html',
        icon: 'graphql-proxy.svg',
        info: 'Resolves GraphQL queries to data stores',
        initialWidth: 140,
        initialHeight: 90,
        zIndex: -50,
        facetLabels: { field: '%{FACET:Type} %{FACET:Field}' },
        deploymentProperties: {
          arn: '%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/appsync/home?region=%{region}#/%{physicalId|GraphQLApiIdFromArn}/v1/home',
          name: '%{PROPERTY:Name}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'Api Location',
              href: '%{INFO:url}',
              value: '%{INFO:url}',
              type: 'link',
            },
            {
              label: 'Authentication Type',
              value: '%{SETTING:AuthenticationType}',
            },
            { label: 'Field-Level Logging', value: '%{SETTING:FieldLogLevel}' },
          ],
          consoleLinks: [
            {
              label: 'Response Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Response Metrics For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/AppSync',
              dimensions: ['GraphQLAPIId'],
              metrics: [
                {
                  label: 'Total Requests',
                  namespace: 'AWS/AppSync',
                  name: 'Latency',
                  statistic: 'SampleCount',
                  dimensions: {
                    GraphQLAPIId: '%{physicalId|GraphQLApiIdFromArn}',
                  },
                },
                {
                  label: '4XX Response',
                  namespace: 'AWS/AppSync',
                  name: '4XXError',
                  statistic: 'Sum',
                  dimensions: {
                    GraphQLAPIId: '%{physicalId|GraphQLApiIdFromArn}',
                  },
                },
                {
                  label: '5XX Response',
                  namespace: 'AWS/AppSync',
                  name: '5XXError',
                  statistic: 'Sum',
                  dimensions: {
                    GraphQLAPIId: '%{physicalId|GraphQLApiIdFromArn}',
                  },
                },
              ],
            },
            {
              label: 'Response Time',
              type: 'cloudwatchChartLink',
              title:
                "Response Time For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/AppSync',
              dimensions: ['GraphQLAPIId'],
              metrics: [
                {
                  label: 'Total Response Time',
                  namespace: 'AWS/AppSync',
                  name: 'Latency',
                  dimensions: {
                    GraphQLAPIId: '%{physicalId|GraphQLApiIdFromArn}',
                  },
                },
              ],
            },
            {
              label: 'Logs',
              type: 'cloudwatchLogsLink',
              region: '%{region}',
              logGroup: '/aws/appsync/apis/%{physicalId|GraphQLApiIdFromArn}',
            },
          ],
        },
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::AppSync::(GraphQLSchema|Resolver|DataSource)',
      targetType: 'AWS::AppSync::GraphQLApi',
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'graphql' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::AppSync::GraphQLApi',
            Properties: {
              Name: {
                'Fn::Sub': [
                  '${ResourceName} From Stack ${StackTagName} Environment ${EnvironmentTagName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              AuthenticationType: '%{SETTING:AuthenticationType}',
              LogConfig: {
                FieldLogLevel: '%{SETTING:FieldLogLevel}',
                CloudWatchLogsRoleArn: {
                  'Fn::GetAtt': ['%{resourceId}LogsRole', 'Arn'],
                },
              },
              XrayEnabled: true,
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Schema',
          Template: {
            Type: 'AWS::AppSync::GraphQLSchema',
            Properties: {
              Format: {
                SAM: {
                  ApiId: { 'Fn::GetAtt': ['%{resourceId}', 'ApiId'] },
                  Definition: '%{SETTING:Schema}',
                  DefinitionS3Location: '%{resourceId}/schema.graphql',
                },
                serverless: {
                  ApiId: { 'Fn::GetAtt': ['%{resourceId}', 'ApiId'] },
                  Definition: '%{SETTING:Schema}',
                },
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}LogsRole',
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: {
                  Effect: 'Allow',
                  Principal: { Service: 'appsync.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              },
              RoleName: {
                'Fn::Sub': '${AWS::StackName}-%{resourceId|MaxLength(18)}-logs',
              },
              Policies: [
                {
                  PolicyName: 'Log',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'logs:CreateLogGroup',
                          'logs:CreateLogStream',
                          'logs:PutLogEvents',
                        ],
                        Resource: [
                          {
                            'Fn::Sub':
                              'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/appsync/apis/*',
                          },
                          {
                            'Fn::Sub':
                              'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/appsync/apis/*:log-stream:*',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'Name' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources.%{resourceId}.Properties.Name['Fn::Sub'][1].ResourceName",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'AuthenticationType' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.AuthenticationType',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'graphql',
        Setting: 'AuthenticationType',
        Value: 'API_KEY',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.UserPoolConfig',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.OpenIDConnectConfig',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'graphql',
        Setting: 'AuthenticationType',
        Value: 'AWS_IAM',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.UserPoolConfig',
        },
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.OpenIDConnectConfig',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'graphql',
        Setting: 'AuthenticationType',
        Value: 'AMAZON_COGNITO_USER_POOLS',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.OpenIDConnectConfig',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'graphql',
        Setting: 'AuthenticationType',
        Value: 'OPENID_CONNECT',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.UserPoolConfig',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'CognitoUserPoolId' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.UserPoolConfig',
          Template: {
            UserPoolId: '%{SETTING:CognitoUserPoolId}',
            AwsRegion: {
              'Fn::Select': [
                0,
                { 'Fn::Split': ['_', '%{SETTING:CognitoUserPoolId}'] },
              ],
            },
            DefaultAction: 'ALLOW',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'OpenIDConnectIssuer' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.OpenIDConnectConfig.Issuer',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'FieldLogLevel' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.LogConfig.FieldLogLevel',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'graphql',
        Setting: 'SaveSchemaInFile',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLSchema' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')].Properties.DefinitionS3Location",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'SchemaLocation' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLSchema' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')].Properties.DefinitionS3Location",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'graphql', Setting: 'Schema' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::GraphQLSchema' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}')].Properties.Definition",
        },
      ],
    },
    {
      Action: 'AddFacet',
      Conditions: { ResourceType: 'graphql', FacetType: 'field' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}%{FACET:Type|LogicalId}%{FACET:Field|LogicalId}Resolver',
          Template: {
            Type: 'AWS::AppSync::Resolver',
            Properties: {
              TypeName: '%{FACET:Type}',
              DataSourceName: {
                'Fn::GetAtt': ['%{resourceId}LocalDataSource', 'Name'],
              },
              RequestMappingTemplate: '%{FACETSETTING:RequestMappingTemplate}',
              RequestMappingTemplateS3Location:
                '%{SETTING:SchemaLocation|AppSyncRequestLocation}',
              ResponseMappingTemplate:
                '%{FACETSETTING:ResponseMappingTemplate}',
              ResponseMappingTemplateS3Location:
                '%{SETTING:SchemaLocation|AppSyncResponseLocation}',
              ApiId: { 'Fn::GetAtt': ['%{resourceId}', 'ApiId'] },
              FieldName: '%{FACET:Field}',
            },
            DependsOn: '%{resourceId}Schema',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}LocalDataSource',
          Template: {
            Type: 'AWS::AppSync::DataSource',
            Properties: {
              Type: 'NONE',
              ApiId: { 'Fn::GetAtt': ['%{resourceId}', 'ApiId'] },
              Name: 'Local',
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'graphql',
        FacetType: 'field',
        Setting: 'SaveRequestMappingTemplateInFile',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.RequestMappingTemplateS3Location",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'graphql',
        FacetType: 'field',
        Setting: 'RequestMappingTemplateLocation',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.RequestMappingTemplateS3Location",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'graphql',
        FacetType: 'field',
        Setting: 'RequestMappingTemplate',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.RequestMappingTemplate",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'graphql',
        FacetType: 'field',
        Setting: 'SaveResponseMappingTemplateInFile',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.ResponseMappingTemplateS3Location",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'graphql',
        FacetType: 'field',
        Setting: 'ResponseMappingTemplateLocation',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.ResponseMappingTemplateS3Location",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'graphql',
        FacetType: 'field',
        Setting: 'ResponseMappingTemplate',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] === '%{resourceId}' && @.Properties.TypeName === '%{FACET:Type}' && @.Properties.FieldName === '%{FACET:Field}')].Properties.ResponseMappingTemplate",
        },
      ],
    },
  ],
};
