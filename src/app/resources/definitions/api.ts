export default {
  ResourceTypes: {
    api: {
      OnlyFormats: ['SAM'],
      Locator: "$.Resources[?(@.Type === 'AWS::Serverless::Api')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Routes: {
          Label: 'Routes',
          ValueType: 'array',
          Type: 'map',
          ValuesType: 'string',
          Fields: [
            {
              Label: 'Method',
              ValueType: 'string',
              InputType: 'select',
              Choices: ['HEAD', 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'ANY'],
            },
            { Label: 'Path', ValueType: 'string', InputType: 'input' },
          ],
          Default: [{ Method: 'GET', Path: '/' }],
          Path: '@.Properties.DefinitionBody.paths',
          Transformations: ['ApiRoutesFromSwagger'],
          FacetType: 'route',
        },
        EnableCors: {
          Label: 'Enable CORS',
          Description:
            'Enable Cross Origin Resource Sharing (CORS) required by browser ajax calls',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.Cors',
          Transformations: ['Boolean'],
        },
        CorsConfig: {
          Label: 'CORS Access Control Headers',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { EnableCors: true },
          Description: "'''*''' will allow CORS requests from any domain",
          Default: {
            AllowHeaders: "'Authorization,Content-Type'",
            AllowOrigin: "'*'",
          },
          Path: '@.Properties.Cors',
        },
        ProvisionCustomDomain: {
          Label: 'Provision Custom Domain',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "$.Resources[?(@.Type === 'AWS::ApiGateway::BasePathMapping' && @.Properties.RestApiId.Ref === '%{resourceId}')]",
          Transformations: ['Boolean'],
        },
        CustomDomain: {
          Label: 'Domain',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { ProvisionCustomDomain: true },
          Default: null,
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGateway::BasePathMapping' && @.Properties.RestApiId.Ref === '%{resourceId}')].Properties.DomainName.Ref",
            "$.Resources['%{value}'].Properties.DomainName",
          ],
        },
        CustomDomainValidationDomain: {
          Label: 'Validation Domain',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { ProvisionCustomDomain: true },
          Default: null,
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName === '%{SETTING:CustomDomain}' || @.Properties.DomainName.Ref === '%{SETTING:CustomDomain|LogicalIdFromReference}'))].Properties.DomainValidationOptions['Fn::If'][1][0].ValidationDomain",
        },
        Private: {
          Label: 'Private',
          Description:
            'Private Apis may only be accessed from Virtual Networks connected to them',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Path: '@.Properties.EndpointConfiguration',
          Transformations: ['PrivateApiFromTemplate'],
        },
      },
      FacetSettings: {
        route: {
          ProxyToHTTPService: {
            Label: 'Proxy to existing HTTP service',
            ValueType: 'boolean',
            InputType: 'checkbox',
            Path: "$.Resources['%{resourceId}'].Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration'].type",
            Transformations: ['ApiRouteHttpProxyFromSwagger'],
          },
          ProxyHTTPServiceLocation: {
            DependsOn: { ProxyToHTTPService: true },
            Label: 'HTTP service location',
            ValueType: 'string',
            InputType: 'input',
            Default: 'https://example.com/{proxy}',
            Path: "$.Resources['%{resourceId}'].Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration'].uri",
          },
        },
      },
      SubResourceLocators: [{ Path: '$.Conditions.%{resourceId}CustomDomain' }],
      DashboardProperties: {
        label: 'REST API',
        paletteLabel: 'REST API',
        paletteHint: 'API Gateway REST API (REST API v1)',
        paletteResource: 'AWS::Serverless::Api',
        paletteInfo:
          'Use this resource type to declare a collection of Amazon API Gateway resources and methods that can be invoked through HTTPS endpoints.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-api.html',
        inputs: 1,
        icon: 'rest-api.svg',
        info: 'Outputs messages when HTTP requests are received',
        initialWidth: 140,
        initialHeight: 90,
        zIndex: -50,
        facetLabels: { route: '%{FACET:Method} %{FACET:Path}' },
        deploymentProperties: {
          arn: 'arn:aws:apigateway:%{region}::/restapis/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/apigateway/home?region=%{region}#/apis/%{physicalId}/resources',
          name: '%{PROPERTY:Name}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'Stage Location',
              href: 'https://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}',
              value:
                '%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}',
              type: 'link',
            },
            {
              label: 'Custom Domain Name',
              href: 'https://%{SETTING:CustomDomain}',
              value: '%{SETTING:CustomDomain}',
            },
            {
              label: 'Custom Domain DNS Name',
              value: '%{INFO:customDomain.regionalDomainName}',
            },
          ],
          consoleLinks: [
            {
              label: 'Response Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Response Metrics For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/ApiGateway',
              dimensions: ['ApiName'],
              metrics: [
                {
                  label: 'Total Requests',
                  namespace: 'AWS/ApiGateway',
                  name: 'Count',
                  statistic: 'Sum',
                  dimensions: { ApiName: '%{INFO:restApi.name}' },
                },
                {
                  label: '4XX Response',
                  namespace: 'AWS/ApiGateway',
                  name: '4XXError',
                  statistic: 'Sum',
                  dimensions: { ApiName: '%{INFO:restApi.name}' },
                },
                {
                  label: '5XX Response',
                  namespace: 'AWS/ApiGateway',
                  name: '5XXError',
                  statistic: 'Sum',
                  dimensions: { ApiName: '%{INFO:restApi.name}' },
                },
              ],
            },
            {
              label: 'Response Time',
              type: 'cloudwatchChartLink',
              title:
                "Response Time For API '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: '%{region}',
              namespace: 'AWS/ApiGateway',
              dimensions: ['ApiName'],
              metrics: [
                {
                  label: 'Total Response Time',
                  namespace: 'AWS/ApiGateway',
                  name: 'Latency',
                  dimensions: { ApiName: '%{INFO:restApi.name}' },
                },
                {
                  label: 'Integration Response Time',
                  namespace: 'AWS/ApiGateway',
                  name: 'IntegrationLatency',
                  dimensions: { ApiName: '%{INFO:restApi.name}' },
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
              'https://${%{resourceId}}.execute-api.${AWS::Region}.amazonaws.com/${%{resourceId}.Stage}',
          },
        },
      ],
      DefaultPermissions: { IAMCapable: [{ Actions: ['execute-api:Invoke'] }] },
    },
  },
  PermissionTypes: {
    api: {
      Custom: {
        Actions: ['execute-api:Invoke'],
        Resources: {
          WithDependency: [
            {
              'Fn::Sub':
                'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{resourceId}}/${%{resourceId}.Stage}/*',
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
  GroupingRules: [
    {
      sourceType: 'AWS::ApiGateway::DomainName',
      targetType: 'AWS::CertificateManager::Certificate',
    },
    {
      sourceType: 'AWS::ApiGateway::BasePathMapping',
      targetType: '(AWS::ApiGateway::DomainName|AWS::Serverless::Api)',
    },
    {
      sourceType: 'AWS::ApiGateway::Deployment',
      targetType: 'AWS::ApiGateway::RestApi',
    },
    {
      sourceType: 'AWS::ApiGateway::Method',
      targetType: 'AWS::ApiGateway::RestApi',
    },
    {
      sourceType: 'AWS::ApiGateway::Resource',
      targetType: 'AWS::ApiGateway::RestApi',
    },
  ],
  IntegrationTypes: [
    {
      SourceType: 'api',
      TargetType: 'function',
      FacetType: 'route',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'Api' && @.Properties.RestApiId)]",
        Source: { Path: '@.Properties.RestApiId' },
        Target: { Index: 2 },
        Facet: {
          Path: { Path: '@.Properties.Path' },
          Method: {
            Path: '@.Properties.Method',
            Transformations: ['Uppercase'],
          },
        },
      },
    },
    {
      SourceType: 'virtualNetwork',
      TargetType: 'api',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::Api')].Properties.DefinitionBody['x-amazon-apigateway-policy'].Statement[?(@.Condition.StringEquals['aws:SourceVpc'])]",
        Source: { Path: "@.Condition.StringEquals['aws:SourceVpc']" },
        Target: { Index: 2 },
      },
    },
    {
      SourceType: 'api',
      TargetType: 'stateMachine',
      FacetType: 'route',
      Locator: {
        Path: "$.Resources[?(@.Type == 'AWS::Serverless::StateMachine')].Properties.Events[?(@.Type == 'Api' && @.Properties.RestApiId)]",
        Source: { Path: '@.Properties.RestApiId' },
        Target: { Index: 2 },
        Facet: {
          Path: { Path: '@.Properties.Path' },
          Method: {
            Path: '@.Properties.Method',
            Transformations: ['Uppercase'],
          },
        },
      },
    },
  ],
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'api' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Transform',
          Template: 'AWS::Serverless-2016-10-31',
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::Serverless::Api',
            Properties: {
              Name: {
                'Fn::Sub': [
                  '${ResourceName} From Stack ${StackTagName} Environment ${EnvironmentTagName}',
                  { ResourceName: '%{resourceId}' },
                ],
              },
              StageName: { Ref: 'EnvironmentAPIGatewayStageName' },
              DefinitionBody: {
                swagger: '2.0',
                info: {},
                paths: '%{SETTING:Routes|ApiRoutesToSwagger}',
              },
              EndpointConfiguration: 'REGIONAL',
              TracingEnabled: true,
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'api', Setting: 'Name' },
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
      Conditions: { ResourceType: 'api', Setting: 'Private' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.EndpointConfiguration',
          Transformations: ['PrivateApiToTemplate'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'api', Setting: 'Routes' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.DefinitionBody.paths',
          Transformations: ['ApiRoutesToSwagger'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'api', Setting: 'EnableCors', Value: true },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Cors',
          Template: '%{SETTING:CorsConfig}',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'api', Setting: 'EnableCors', Value: false },
      Reactions: [
        { Type: 'Delete', Path: '$.Resources.%{resourceId}.Properties.Cors' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'api', Setting: 'CorsConfig' },
      Reactions: [
        { Type: 'Upsert', Path: '$.Resources.%{resourceId}.Properties.Cors' },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'api',
        Setting: 'ProvisionCustomDomain',
        Value: true,
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Conditions.%{resourceId}CustomDomain',
          Template: {
            'Fn::Not': [
              {
                'Fn::Equals': [
                  'false',
                  '%{SETTING:CustomDomain|ParameterToRef|NullToEmptyString}',
                ],
              },
            ],
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}SSLCertificate',
          Template: {
            Type: 'AWS::CertificateManager::Certificate',
            Properties: {
              DomainName: '%{SETTING:CustomDomain|ParameterToRef}',
              DomainValidationOptions: {
                'Fn::If': [
                  '%{resourceId}CustomDomain',
                  [
                    {
                      DomainName: '%{SETTING:CustomDomain|ParameterToRef}',
                      ValidationDomain:
                        '%{SETTING:CustomDomainValidationDomain|ParameterToRef}',
                    },
                  ],
                  { Ref: 'AWS::NoValue' },
                ],
              },
            },
            Condition: '%{resourceId}CustomDomain',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}CustomDomain',
          Template: {
            Type: 'AWS::ApiGateway::DomainName',
            Properties: {
              DomainName: '%{SETTING:CustomDomain|ParameterToRef}',
              EndpointConfiguration: { Types: ['REGIONAL'] },
              RegionalCertificateArn: { Ref: '%{resourceId}SSLCertificate' },
            },
            Condition: '%{resourceId}CustomDomain',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}CustomDomainMapping',
          Template: {
            Type: 'AWS::ApiGateway::BasePathMapping',
            Properties: {
              DomainName: { Ref: '%{resourceId}CustomDomain' },
              RestApiId: { Ref: '%{resourceId}' },
              Stage: { Ref: 'EnvironmentAPIGatewayStageName' },
            },
            Condition: '%{resourceId}CustomDomain',
            DependsOn: '%{resourceId}Stage',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'api',
        Setting: 'ProvisionCustomDomain',
        Value: false,
      },
      Reactions: [
        { Type: 'Delete', Path: '$.Conditions.%{resourceId}CustomDomain' },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && @.Properties.DomainName === '%{SETTING:CustomDomain}')]",
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGateway::DomainName' && @.Properties.DomainName === '%{SETTING:CustomDomain}')]",
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGateway::BasePathMapping' && @.Properties.RestApiId.Ref === '%{resourceId}')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'api', Setting: 'CustomDomain' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGateway::BasePathMapping' && @.Properties.RestApiId.Ref === '%{resourceId}')].Properties.DomainName.Ref",
            "$.Resources['%{value}'].Properties.DomainName",
          ],
          Transformations: ['ParameterToRef'],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{currentValue}' || @.Properties.DomainName.Ref === %{currentValue|ParameterToParameterId}) :(@.Properties.DomainName === %{currentValue|JSONStringify})))].Properties.DomainValidationOptions['Fn::If'][1][0].DomainName",
          Transformations: ['ParameterToRef'],
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{currentValue}' || @.Properties.DomainName.Ref === %{currentValue|ParameterToParameterId}) :(@.Properties.DomainName === %{currentValue|JSONStringify})))].Properties.DomainName",
          Transformations: ['ParameterToRef'],
        },
        {
          Type: 'Upsert',
          Path: "$.Conditions.%{resourceId}CustomDomain['Fn::Not'][0]['Fn::Equals'][1]",
          Transformations: ['ParameterToRef'],
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'api',
        Setting: 'CustomDomainValidationDomain',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{SETTING:CustomDomain}' || @.Properties.DomainName.Ref === %{SETTING:CustomDomain|ParameterToParameterId}) :(@.Properties.DomainName === '%{SETTING:CustomDomain}')))].Properties.DomainValidationOptions['Fn::If'][1][0].ValidationDomain",
          Transformations: ['ParameterToRef'],
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'api',
        FacetType: 'route',
        Setting: 'ProxyToHTTPService',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}'].parameters",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'api',
        FacetType: 'route',
        Setting: 'ProxyHTTPServiceLocation',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
          Template: {
            httpMethod: 'ANY',
            type: 'http_proxy',
            uri: '%{FACETSETTING:ProxyHTTPServiceLocation}',
            requestParameters:
              '%{FACETSETTING:ProxyHTTPServiceLocation|ApiRouteHttpProxyIntegrationParameters}',
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}'].parameters",
          Transformations: ['ApiRouteHttpProxySwaggerParameters'],
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'Api' && @.Properties.Path === '%{FACET:Path}' && @.Properties.Method === '%{FACET:Method}' && @.Properties.RestApiId.Ref === '%{resourceId}')]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'api',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}%{FACET:Method}%{FACET:Path|LogicalId}',
          Template: {
            Type: 'Api',
            Properties: {
              Path: '%{FACET:Path}',
              Method: '%{FACET:Method}',
              RestApiId: { Ref: '%{sourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{sourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']",
          Template: {
            'x-amazon-apigateway-integration': {
              httpMethod: 'POST',
              type: 'aws_proxy',
              uri: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${%{targetId}.Arn}/invocations',
              },
            },
            responses: {},
          },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}ExistingResource',
            '$.Resources.%{targetId}ExistingResource%{sourceId}%{FACET:Method}%{FACET:Path|LogicalId}Permission',
          ],
          Template: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
              Action: 'lambda:InvokeFunction',
              Principal: 'apigateway.amazonaws.com',
              FunctionName: { Ref: '%{targetId}ExistingResource' },
              SourceArn: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{sourceId}}/*/%{FACET:Method}%{FACET:Path}',
              },
            },
            Condition: '%{targetId}UseExistingResource',
          },
        },
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}ExistingResource',
            "$.Resources.%{sourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration'].uri",
          ],
          Template: {
            'Fn::If': [
              '%{targetId}UseExistingResource',
              {
                'Fn::Sub':
                  'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${%{targetId}ExistingResource.Arn}/invocations',
              },
              {
                'Fn::Sub':
                  'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${%{targetId}.Arn}/invocations',
              },
            ],
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'api',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{targetId}.Properties.Events.%{integrationId}',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::Lambda::Permission' && @.Properties.FunctionName.Ref === '%{targetId}ExistingResource' && @.Properties.SourceArn['Fn::Sub'] === 'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${%{sourceId}}/${%{sourceId}.Stage}/%{FACET:Method}%{FACET:Path}')]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: { SourceType: 'virtualNetwork', TargetType: 'api' },
      Reactions: [
        {
          Type: 'Append',
          Path: "$.Resources.%{targetId}.Properties.DefinitionBody['x-amazon-apigateway-policy'].Statement",
          Template: {
            Effect: 'Allow',
            Principal: '*',
            Action: 'execute-api:Invoke',
            Resource: {
              'Fn::Sub':
                'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:*',
            },
            Condition: {
              StringEquals: { 'aws:SourceVpc': { Ref: '%{sourceId}' } },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{targetId}.Properties.DefinitionBody['x-amazon-apigateway-policy'].Version",
          Template: '2012-10-17',
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: { SourceType: 'virtualNetwork', TargetType: 'api' },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{targetId}.Properties.DefinitionBody['x-amazon-apigateway-policy'].Statement[%{integrationId}]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'api',
        TargetType: 'stateMachine',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}%{FACET:Method}%{FACET:Path|LogicalId}',
          Template: {
            Type: 'Api',
            Properties: {
              Path: '%{FACET:Path}',
              Method: '%{FACET:Method}',
              RestApiId: { Ref: '%{sourceId}' },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{sourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']",
          Template: {
            responses: { '200': { description: 'default OK response' } },
            'x-amazon-apigateway-integration': {
              credentials: {
                'Fn::GetAtt': ['%{sourceId}To%{targetId}Role', 'Arn'],
              },
              httpMethod: 'POST',
              type: 'aws',
              uri: {
                'Fn::Sub':
                  'arn:${AWS::Partition}:apigateway:${AWS::Region}:states:action/StartExecution',
              },
              responses: { default: { statusCode: 200 } },
              requestTemplates: {
                'application/json': {
                  'Fn::Sub':
                    '{\n  "input": "$util.escapeJavaScript($input.json(\'$\'))",\n  "name": "$context.requestId",\n  "stateMachineArn": "arn:${AWS::Partition}:states:${AWS::Region}:${AWS::AccountId}:stateMachine:${AWS::StackName}-%{targetId}"\n}',
                },
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: ['$.Resources.%{sourceId}To%{targetId}Role'],
          Template: {
            Type: 'AWS::IAM::Role',
            Properties: {
              AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['sts:AssumeRole'],
                    Principal: { Service: ['apigateway.amazonaws.com'] },
                  },
                ],
              },
              Policies: [
                {
                  PolicyName: 'ExecuteStateMachine',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: ['states:StartExecution'],
                        Resource: [{ 'Fn::GetAtt': ['%{targetId}', 'Arn'] }],
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
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'api',
        TargetType: 'stateMachine',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{targetId}.Properties.Events.%{integrationId}',
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.DefinitionBody.paths['%{FACET:Path}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
        },
        { Type: 'Delete', Path: "$.Resources['%{sourceId}%{targetId}Role']" },
      ],
    },
  ],
};
