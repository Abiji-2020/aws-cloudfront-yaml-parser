export default {
  ResourceTypes: {
    websocket: {
      OnlyFormats: ['SAM'],
      Locator:
        "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Api' && @.Properties.ProtocolType === 'WEBSOCKET')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        RouteKeySelectionExpression: {
          Label: 'Route Key Selection Expression',
          ValueType: 'string',
          Description: 'Location of routing attribute in received messages',
          InputType: 'input',
          Default: '$request.body.action',
          Path: '@.Properties.RouteSelectionExpression',
        },
        Authorizers: {
          Label: 'Custom Authorizers',
          ValueType: 'array',
          Type: 'map',
          ValuesType: 'string',
          Fields: [{ Label: 'Name', ValueType: 'string', InputType: 'input' }],
          Default: [],
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{resourceId}')]",
          FacetType: 'authorizer',
          FacetPropertyBindings: { Name: '@.Properties.Name' },
        },
        Routes: {
          Label: 'Routes',
          ValueType: 'array',
          Type: 'map',
          ValuesType: 'string',
          Fields: [{ Label: 'Key', ValueType: 'string', InputType: 'input' }],
          Default: [],
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}')]",
          FacetType: 'route',
          FacetPropertyBindings: { Key: '@.Properties.RouteKey' },
        },
      },
      FacetSettings: {
        authorizer: {
          ResultCacheTTL: {
            Label: 'Result Cache Time-To-Live',
            Description: 'Seconds from 0 (caching disabled) to 3600 (1 hour)',
            Type: 'number',
            InputType: 'input',
            Default: 300,
            AwsDefault: 300,
            Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.Name === '%{FACET:Name}')].Properties.AuthorizerResultTtlInSeconds",
          },
          IdentitySources: {
            Label: 'Identity Sources',
            Description: 'Location of authentication token in requests',
            Type: 'map',
            ValueType: 'array',
            Items: { Label: 'Source', ValueType: 'string', InputType: 'input' },
            Default: ['route.request.querystring.Auth'],
            Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.Name === '%{FACET:Name}')].Properties.IdentitySource",
          },
        },
        route: {
          Name: {
            Label: 'Operation Name',
            Type: 'string',
            InputType: 'input',
            IsOptional: true,
            Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.OperationName",
          },
          AuthorizationType: {
            Label: 'Authorization Type',
            Description: 'Authorization is only allowed on the $connect route',
            Type: 'string',
            InputType: 'select',
            Choices: [
              { Label: 'None', Value: 'NONE' },
              { Label: 'Custom Authorizer', Value: 'CUSTOM' },
              { Label: 'IAM Credentials', Value: 'AWS_IAM' },
            ],
            Default: 'NONE',
            AwsDefault: 'NONE',
            Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.AuthorizationType",
          },
          Authorizer: {
            Label: 'Custom Authorizer',
            Type: 'string',
            InputType: 'select',
            Choices: {
              ResourceSetting: 'Authorizers',
              LabelPath: '@.Name',
              ValuePath: '@.ResourceId',
            },
            DependsOn: { AuthorizationType: 'CUSTOM' },
            Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.AuthorizerId.Ref",
          },
        },
      },
      DashboardProperties: {
        label: 'WebSocket Api',
        paletteLabel: 'WebSocket Api',
        paletteHint: 'WebSocket Api',
        paletteResource: 'AWS::ApiGatewayV2::Api',
        paletteInfo: 'Use this resource type to declare a WebSocket Api.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-apigatewayv2-api.html',
        inputs: 1,
        icon: 'ic-aws-api-gateway.svg',
        info: 'Outputs messages when WebSocket messages are received',
        initialWidth: 140,
        initialHeight: 90,
        zIndex: -50,
        facetLabels: {
          authorizer: 'Authorizer %{FACET:Name}',
          route: 'Route %{FACET:Key}',
        },
        deploymentProperties: {
          arn: 'arn:aws:apigateway:%{region}::/apis/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/apigateway/home?region=%{region}#/apis/%{physicalId}/routes',
          name: '%{PROPERTY:Name}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'WebSocket URL',
              href: 'wss://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}',
              value:
                'wss://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}',
              type: 'link',
            },
            {
              label: 'Connection URL',
              href: 'https://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}/@connections',
              value:
                'https://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}/@connections',
              type: 'link',
            },
          ],
          consoleLinks: [
            {
              label: 'Connection Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Connection Metrics For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/ApiGateway',
              dimensions: ['ApiId'],
              metrics: [
                {
                  label: 'Connections',
                  namespace: 'AWS/ApiGateway',
                  name: 'ConnectCount',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Message Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Message Metrics For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/ApiGateway',
              dimensions: ['ApiId'],
              metrics: [
                {
                  label: 'Messages',
                  namespace: 'AWS/ApiGateway',
                  name: 'MessageCount',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}' },
                },
                {
                  label: 'Client Errors',
                  namespace: 'AWS/ApiGateway',
                  name: 'ClientError',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}' },
                },
                {
                  label: 'Execution Errors',
                  namespace: 'AWS/ApiGateway',
                  name: 'ExecutionError',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}' },
                },
                {
                  label: 'Integration Errors',
                  namespace: 'AWS/ApiGateway',
                  name: 'IntegrationError',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}' },
                },
              ],
            },
            {
              label: 'Integration Response Time',
              type: 'cloudwatchChartLink',
              title:
                "Integration Response Time For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/ApiGateway',
              dimensions: ['ApiId'],
              metrics: [
                {
                  label: 'Integration Response Time',
                  namespace: 'AWS/ApiGateway',
                  name: 'IntegrationLatency',
                  dimensions: { ApiId: '%{physicalId}' },
                },
              ],
            },
          ],
        },
      },
      DefaultReferences: [
        {
          API_URL: {
            'Fn::Sub':
              'wss://${%{resourceId}}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentAPIGatewayStageName}',
          },
        },
        {
          API_CONNECTIONS_ENDPOINT: {
            'Fn::Sub':
              'https://${%{resourceId}}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentAPIGatewayStageName}',
          },
        },
      ],
      DefaultPermissions: {
        IAMCapable: [{ Actions: ['execute-api:ManageConnections'] }],
      },
    },
  },
  GroupingRules: [
    {
      sourceType: 'AWS::ApiGatewayV2::RouteResponse',
      targetType: 'AWS::ApiGatewayV2::Route',
    },
    {
      sourceType: 'AWS::ApiGatewayV2::(?!RouteResponse).*',
      targetType: 'AWS::ApiGatewayV2::Api',
    },
  ],
  PermissionTypes: {
    websocket: {
      Custom: {
        Actions: ['execute-api:ManageConnections'],
        Resources: {
          WithDependency: [
            {
              'Fn::Sub':
                'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{resourceId}}/*',
            },
          ],
          WithoutDependency: [
            {
              'Fn::Sub':
                'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:*',
            },
          ],
        },
      },
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'websocket',
      TargetType: 'function',
      FacetType: 'authorizer',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.AuthorizerUri['Fn::Sub'])]",
        OwnLocatedResource: false,
        Source: { Path: '@.Properties.ApiId' },
        Target: {
          Path: '@.Properties.AuthorizerUri',
          Transformations: ['ApiGatewayIntegrationUriToLambdaReference'],
        },
        Facet: { Name: { Path: '@.Properties.Name' } },
      },
    },
    {
      SourceType: 'websocket',
      TargetType: 'function',
      FacetType: 'route',
      Locator: {
        Path: [
          "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.Target)]",
          {
            Path: '$.Resources.%{key}.Properties.Target',
            Transformations: ['WebSocketRouteToIntegrationLogicalId'],
          },
          '$.Resources.%{value}',
        ],
        Source: { Path: '@.Properties.ApiId' },
        Target: {
          Path: '@.Properties.IntegrationUri',
          Transformations: ['ApiGatewayIntegrationUriToLambdaReference'],
        },
        Facet: { Key: { Path: '$.Resources.%{keys[0]}.Properties.RouteKey' } },
      },
      SubResourceLocators: [
        {
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::IntegrationResponse' && @.Properties.ApiId.Ref === '%{sourceId}' && @.Properties.IntegrationId.Ref === '%{values[1]}')]",
        },
      ],
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'websocket' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::ApiGatewayV2::Api',
            Properties: {
              Description: {
                'Fn::Sub': [
                  '${ResourceName} From Stack ${StackTagName} Environment ${EnvironmentTagName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              Name: {
                'Fn::Sub': [
                  '${StackTagName}-${EnvironmentTagName}-${ResourceName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              ProtocolType: 'WEBSOCKET',
              RouteSelectionExpression:
                '%{SETTING:RouteKeySelectionExpression}',
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Stage',
          Template: {
            Type: 'AWS::ApiGatewayV2::Stage',
            Properties: {
              ApiId: { Ref: '%{resourceId}' },
              StageName: { Ref: 'EnvironmentAPIGatewayStageName' },
              DeploymentId: { Ref: '%{resourceId}Deployment' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Deployment',
          Template: {
            Type: 'AWS::ApiGatewayV2::Deployment',
            Properties: { ApiId: { Ref: '%{resourceId}' } },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'websocket', Setting: 'Name' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources.%{resourceId}.Properties.Name['Fn::Sub'][1].ResourceName",
        },
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: "$.Resources.%{resourceId}.Properties.Description['Fn::Sub'][1].ResourceName",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'websocket',
        Setting: 'RouteKeySelectionExpression',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.RouteSelectionExpression',
        },
      ],
    },
    {
      Action: 'AddFacet',
      Conditions: { ResourceType: 'websocket', FacetType: 'authorizer' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Authorizer%{FACET:Name|LogicalId}',
          Template: {
            Type: 'AWS::ApiGatewayV2::Authorizer',
            Properties: {
              ApiId: { Ref: '%{resourceId}' },
              AuthorizerType: 'REQUEST',
              IdentitySource: '%{FACETSETTING:IdentitySources}',
              Name: '%{FACET:Name}',
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'authorizer',
        Setting: 'ResultCacheTTL',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.Name === '%{FACET:Name}')].Properties.AuthorizerResultTtlInSeconds",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'authorizer',
        Setting: 'IdentitySources',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.Name === '%{FACET:Name}')].Properties.IdentitySource",
        },
      ],
    },
    {
      Action: 'AddFacet',
      Conditions: { ResourceType: 'websocket', FacetType: 'route' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Route%{FACET:Key|LogicalId}',
          Template: {
            Type: 'AWS::ApiGatewayV2::Route',
            Properties: {
              ApiId: { Ref: '%{resourceId}' },
              RouteKey: '%{FACET:Key}',
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}Route%{FACET:Key|LogicalId}Response',
          Template: {
            Type: 'AWS::ApiGatewayV2::RouteResponse',
            Properties: {
              ApiId: { Ref: '%{resourceId}' },
              RouteId: { Ref: '%{resourceId}Route%{FACET:Key|LogicalId}' },
              RouteResponseKey: '$default',
            },
          },
        },
        {
          Type: 'Append',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Deployment' && @.Properties.ApiId.Ref === '%{resourceId}')].DependsOn",
          Template: '%{resourceId}Route%{FACET:Key|LogicalId}',
        },
        {
          Type: 'Append',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Deployment' && @.Properties.ApiId.Ref === '%{resourceId}')].DependsOn",
          Template: '%{resourceId}Route%{FACET:Key|LogicalId}Response',
        },
      ],
    },
    {
      Action: 'DeleteFacet',
      Conditions: { ResourceType: 'websocket', FacetType: 'route' },
      Reactions: [
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')]",
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::RouteResponse' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteId.Ref === '%{key}')]",
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Deployment' && @.Properties.ApiId.Ref === '%{resourceId}')].DependsOn[?(@ === '%{key}')]",
          ],
        },
        {
          Type: 'Delete',
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')]",
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Deployment' && @.Properties.ApiId.Ref === '%{resourceId}')].DependsOn[?(@ === '%{key}')]",
          ],
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'route',
        Setting: 'Name',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.OperationName",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'route',
        Setting: 'AuthorizationType',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.AuthorizationType",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'route',
        Setting: 'AuthorizationType',
        Value: 'NONE',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.AuthorizerId",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'route',
        Setting: 'AuthorizationType',
        Value: 'AWS_IAM',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.AuthorizerId",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'websocket',
        FacetType: 'route',
        Setting: 'Authorizer',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.AuthorizerId",
          Template: { Ref: '%{FACETSETTING:Authorizer}' },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'websocket',
        TargetType: 'function',
        FacetType: 'authorizer',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{sourceId}' && @.Properties.Name === '%{FACET:Name}')].Properties.AuthorizerUri",
          Template: {
            'Fn::Sub':
              'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${%{targetId}.Arn}/invocations',
          },
        },
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{sourceId}' && @.Properties.Name === '%{FACET:Name}')]",
            '$.Resources.%{sourceId}Authorizer%{FACET:Name|LogicalId}Permission',
          ],
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              Action: 'lambda:InvokeFunction',
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'apigateway.amazonaws.com',
              SourceArn: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{sourceId}}/authorizers/${%{keys[0]}}',
              },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'websocket',
        TargetType: 'function',
        FacetType: 'authorizer',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Authorizer' && @.Properties.ApiId.Ref === '%{sourceId}' && @.Properties.Name === '%{FACET:Name}')].Properties.AuthorizerUri",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'websocket',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}Route%{FACET:Key|LogicalId}Integration',
          Template: {
            Type: 'AWS::ApiGatewayV2::Integration',
            Properties: {
              ApiId: { Ref: '%{sourceId}' },
              IntegrationType: 'AWS_PROXY',
              IntegrationUri: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${%{targetId}.Arn}/invocations',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{sourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.Target",
          Template: {
            'Fn::Sub':
              'integrations/${%{sourceId}Route%{FACET:Key|LogicalId}Integration}',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}Route%{FACET:Key|LogicalId}IntegrationPermission',
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              Action: 'lambda:InvokeFunction',
              FunctionName: { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
              Principal: 'apigateway.amazonaws.com',
              SourceArn: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{sourceId}}/*/%{FACET:Key}',
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}Route%{FACET:Key|LogicalId}IntegrationResponse',
          Template: {
            Type: 'AWS::ApiGatewayV2::IntegrationResponse',
            Properties: {
              ApiId: { Ref: '%{sourceId}' },
              IntegrationId: {
                Ref: '%{sourceId}Route%{FACET:Key|LogicalId}Integration',
              },
              IntegrationResponseKey: '$default',
            },
          },
        },
        {
          Type: 'Append',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Deployment' && @.Properties.ApiId.Ref === '%{sourceId}')].DependsOn",
          Template: '%{sourceId}Route%{FACET:Key|LogicalId}IntegrationResponse',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'websocket',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Route' && @.Properties.ApiId.Ref === '%{resourceId}' && @.Properties.RouteKey === '%{FACET:Key}')].Properties.Target",
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::Deployment' && @.Properties.ApiId.Ref === '%{sourceId}')].DependsOn[?(@ === '%{sourceId}Route%{FACET:Key|LogicalId}IntegrationResponse')]",
        },
      ],
    },
  ],
};
