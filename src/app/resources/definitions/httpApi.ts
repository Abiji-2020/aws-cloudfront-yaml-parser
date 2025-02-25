export default {
  ResourceTypes: {
    httpApi: {
      Locator: "$.Resources[?(@.Type === 'AWS::Serverless::HttpApi')]",
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Authorizers: {
          Label: 'JWT / OIDC Authorizers',
          ValueType: 'array',
          Type: 'map',
          ValuesType: 'string',
          Fields: [{ Label: 'Name', ValueType: 'string', InputType: 'input' }],
          Default: [],
          Path: '@.Properties.Auth.Authorizers',
          Transformations: ['HttpApiAuthorizersFromTemplate'],
          FacetType: 'authorizer',
        },
        DefaultAuthorizer: {
          Label: 'Default Authorizer',
          ValueType: 'string',
          InputType: 'input',
          IsOptional: true,
          Path: '@.Properties.Auth.DefaultAuthorizer',
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
        CORSAllowedOriginsEnabled: {
          Label: 'Set CORS Allowed Origins',
          Description:
            'Set Access-Control-Allow-Origin header in all responses',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.CorsConfiguration.AllowOrigins',
          Transformations: ['Boolean'],
        },
        CORSAllowedOrigins: {
          Label: 'CORS Allowed Origins',
          Description:
            'List of origins allowed via Access-Control-Allow-Origin',
          ValueType: 'array',
          Input: 'yaml',
          IsConfigurable: true,
          DependsOn: { CORSAllowedOriginsEnabled: true },
          Default: ['https://example.com'],
          Path: '@.Properties.CorsConfiguration.AllowOrigins',
        },
        CORSAllowedHeadersEnabled: {
          Label: 'Set CORS Allowed Headers',
          Description:
            'Set Access-Control-Allow-Headers header in all responses',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.CorsConfiguration.AllowHeaders',
          Transformations: ['Boolean'],
        },
        CORSAllowedHeaders: {
          Label: 'CORS Allowed Headers',
          Description:
            'List of headers allowed via Access-Control-Allow-Headers',
          ValueType: 'array',
          Input: 'yaml',
          IsConfigurable: true,
          DependsOn: { CORSAllowedHeadersEnabled: true },
          Default: ['Authorization', 'Content-Type'],
          Path: '@.Properties.CorsConfiguration.AllowHeaders',
        },
        CORSAllowedMethodsEnabled: {
          Label: 'Set CORS Allowed Methods',
          Description:
            'Set Access-Control-Allow-Methods header in all responses',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.CorsConfiguration.AllowMethods',
          Transformations: ['Boolean'],
        },
        CORSAllowedMethods: {
          Label: 'CORS Allowed Methods',
          Description:
            'List of methods allowed via Access-Control-Allow-Methods',
          ValueType: 'array',
          Input: 'yaml',
          IsConfigurable: true,
          DependsOn: { CORSAllowedMethodsEnabled: true },
          Default: ['*'],
          Path: '@.Properties.CorsConfiguration.AllowMethods',
        },
        CORSExposedHeadersEnabled: {
          Label: 'Set CORS Exposed Headers',
          Description:
            'Set Access-Control-Expose-Headers header in all responses',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.CorsConfiguration.ExposeHeaders',
          Transformations: ['Boolean'],
        },
        CORSExposedHeaders: {
          Label: 'CORS Exposed Headers',
          Description:
            'List of headers allowed via Access-Control-Expose-Headers',
          ValueType: 'array',
          Input: 'yaml',
          IsConfigurable: true,
          DependsOn: { CORSExposedHeadersEnabled: true },
          Default: ['Content-Length', 'Content-Type'],
          Path: '@.Properties.CorsConfiguration.ExposeHeaders',
        },
        CORSAllowCredentialsEnabled: {
          Label: 'Set CORS Allow Credentials',
          Description:
            'Set Access-Control-Allow-Credentials header in all responses',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.CorsConfiguration.AllowCredentials',
          Transformations: ['Boolean'],
        },
        CORSAllowCredentials: {
          Label: 'CORS Allow Credentials',
          Description: 'CORS Access-Control-Allow-Credentials value',
          ValueType: 'boolean',
          InputType: 'checkbox',
          DependsOn: { CORSAllowCredentialsEnabled: true },
          Default: true,
          Path: '@.Properties.CorsConfiguration.AllowCredentials',
        },
        CORSMaxAgeEnabled: {
          Label: 'Set CORS Max Age',
          Description: 'Set Access-Control-Max-Age header in all responses',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: '@.Properties.CorsConfiguration.MaxAge',
          Transformations: ['Boolean'],
        },
        CORSMaxAge: {
          Label: 'CORS Max Age',
          Description: 'CORS Max Age (in seconds) via Access-Control-Max-Age',
          ValueType: 'number',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { CORSMaxAgeEnabled: true },
          Default: 86400,
          Path: '@.Properties.CorsConfiguration.MaxAge',
        },
        ProvisionCustomDomain: {
          Label: 'Provision Custom Domain',
          ValueType: 'boolean',
          InputType: 'checkbox',
          Default: false,
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::ApiMapping' && @.Properties.ApiId.Ref === '%{resourceId}')]",
          Transformations: ['Boolean'],
        },
        CustomDomain: {
          Label: 'Domain',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { ProvisionCustomDomain: true },
          IsOptional: true,
          Default: null,
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::ApiMapping' && @.Properties.ApiId.Ref === '%{resourceId}')].Properties.DomainName.Ref",
            "$.Resources['%{value}'].Properties.DomainName",
          ],
        },
        CustomDomainValidationDomain: {
          Label: 'Validation Domain',
          ValueType: 'string',
          InputType: 'input',
          IsConfigurable: true,
          DependsOn: { ProvisionCustomDomain: true },
          IsOptional: true,
          Default: null,
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName === '%{SETTING:CustomDomain}' || @.Properties.DomainName.Ref === '%{SETTING:CustomDomain|LogicalIdFromReference}'))].Properties.DomainValidationOptions['Fn::If'][1][0].ValidationDomain",
        },
      },
      FacetSettings: {
        authorizer: {
          IdentitySource: {
            Label: 'Identity Source',
            Description: 'Location of JWT token in requests',
            ValueType: 'string',
            InputType: 'input',
            Default: '$request.header.Authorization',
            Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].IdentitySource",
          },
          JWTIssuer: {
            Label: 'JWT Issuer',
            Description: 'Issuer value to match against JWT token "iss" field',
            ValueType: 'string',
            InputType: 'input',
            IsConfigurable: true,
            IsOptional: true,
            Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.issuer",
          },
          JWTAudience: {
            Label: 'JWT Audience',
            Description:
              'Audience value to match against JWT token "aud" field',
            ValueType: 'array',
            InputType: 'yaml',
            IsConfigurable: true,
            IsOptional: true,
            Default: [],
            Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.audience",
          },
          AuthorizationScopes: {
            Label: 'Authorization Scopes',
            Description:
              'Optional list of authorization scopes for this authorizer',
            ValueType: 'array',
            InputType: 'yaml',
            IsConfigurable: true,
            IsOptional: true,
            Default: [],
            Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].AuthorizationScopes",
          },
        },
        route: {
          ProxyToHTTPService: {
            Label: 'Proxy to existing HTTP service',
            ValueType: 'boolean',
            InputType: 'checkbox',
            Path: "$.Resources['%{resourceId}'].Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration'].type",
            Transformations: ['ApiRouteHttpProxyFromSwagger'],
          },
          ProxyHTTPServiceLocation: {
            DependsOn: { ProxyToHTTPService: true },
            Label: 'HTTP service location',
            ValueType: 'string',
            InputType: 'input',
            IsConfigurable: true,
            Default: 'https://example.com/{proxy}',
            Path: "$.Resources['%{resourceId}'].Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration'].uri",
          },
        },
      },
      SubResourceLocators: [{ Path: '$.Conditions.%{resourceId}CustomDomain' }],
      DashboardProperties: {
        label: 'HTTP API',
        paletteLabel: 'HTTP API',
        paletteHint: 'API Gateway HTTP API (REST API v2)',
        paletteResource: 'AWS::Serverless::HttpApi',
        paletteInfo:
          'Use this resource type to declare a collection of Amazon API Gateway resources and methods that can be invoked through HTTPS endpoints.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-httpapi.html',
        inputs: 1,
        icon: 'rest-api.svg',
        info: 'Outputs messages when HTTP requests are received',
        initialWidth: 140,
        initialHeight: 90,
        zIndex: -50,
        facetLabels: {
          authorizer: 'Authorizer %{FACET:Name}',
          route: '%{FACET:Method} %{FACET:Path}',
        },
        deploymentProperties: {
          arnLink:
            'https://console.aws.amazon.com/apigateway/main/api-detail?api=%{physicalId}&region=%{region}',
          id: '%{resourceId}',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'Stage Location',
              href: 'https://%{physicalId}.execute-api.%{region}.amazonaws.com/',
              value: '%{physicalId}.execute-api.%{region}.amazonaws.com/',
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
                  dimensions: { ApiId: '%{physicalId}', Stage: '$default' },
                },
                {
                  label: '4XX Response',
                  namespace: 'AWS/ApiGateway',
                  name: '4XXError',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}', Stage: '$default' },
                },
                {
                  label: '5XX Response',
                  namespace: 'AWS/ApiGateway',
                  name: '5XXError',
                  statistic: 'Sum',
                  dimensions: { ApiId: '%{physicalId}', Stage: '$default' },
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
                  dimensions: { ApiId: '%{physicalId}', Stage: '$default' },
                },
                {
                  label: 'Integration Response Time',
                  namespace: 'AWS/ApiGateway',
                  name: 'IntegrationLatency',
                  dimensions: { ApiId: '%{physicalId}', Stage: '$default' },
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
              'https://${%{resourceId}}.execute-api.${AWS::Region}.amazonaws.com',
          },
        },
      ],
      DefaultPermissions: { IAMCapable: [{ Actions: ['execute-api:Invoke'] }] },
    },
  },
  PermissionTypes: {
    httpApi: {
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
      sourceType: 'AWS::ApiGatewayV2::DomainName',
      targetType: 'AWS::CertificateManager::Certificate',
    },
    {
      sourceType: 'AWS::ApiGatewayV2::ApiMapping',
      targetType: '(AWS::ApiGatewayV2::DomainName|AWS::Serverless::HttpApi)',
    },
  ],
  IntegrationTypes: [
    {
      SourceType: 'httpApi',
      TargetType: 'userPoolClient',
      FacetType: 'authorizer',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::HttpApi')].Properties.Auth.Authorizers[*].JwtConfiguration.audience[?(@.Ref)]",
        Source: { Index: 2 },
        Target: { Path: '@' },
        Facet: {
          Name: { Index: 6, Transformations: 'LogicalIdFromReference' },
        },
      },
    },
    {
      SourceType: 'httpApi',
      TargetType: 'function',
      FacetType: 'route',
      Locator: {
        Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'HttpApi' && @.Properties.ApiId)]",
        Source: { Path: '@.Properties.ApiId' },
        Target: { Index: 2 },
        Facet: {
          Path: {
            Path: '@.Properties.Path',
            Transformations: ['HttpApiDefaultRouteWithoutPrefix'],
          },
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
      Conditions: { ResourceType: 'httpApi' },
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
            Type: 'AWS::Serverless::HttpApi',
            Properties: {
              DefinitionBody: {
                openapi: '3.0',
                info: {
                  title: { 'Fn::Sub': '${AWS::StackName}-%{resourceId}' },
                  version: '1.0',
                },
                paths: '%{SETTING:Routes|ApiRoutesToSwagger}',
              },
              FailOnWarnings: true,
            },
          },
        },
      ],
    },
    {
      Action: 'AddFacet',
      Conditions: { ResourceType: 'httpApi', FacetType: 'authorizer' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}']",
          Template: { IdentitySource: '$request.header.Authorization' },
        },
      ],
    },
    {
      Action: 'DeleteFacet',
      Conditions: { ResourceType: 'httpApi', FacetType: 'authorizer' },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}']",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'DefaultAuthorizer' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.Auth.DefaultAuthorizer',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'Routes' },
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
      Conditions: { ResourceType: 'httpApi', Setting: 'CORSAllowedOrigins' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowOrigins',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'CORSAllowedOriginsEnabled',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowOrigins',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'CORSAllowedHeaders' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowHeaders',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'CORSAllowedHeadersEnabled',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowHeaders',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'CORSAllowedMethods' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowMethods',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'CORSAllowedMethodsEnabled',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowMethods',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'CORSExposedHeaders' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.ExposeHeaders',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'CORSExposedHeadersEnabled',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.ExposeHeaders',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'CORSAllowCredentials' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowCredentials',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'CORSAllowCredentialsEnabled',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.AllowCredentials',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'CORSMaxAge' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.MaxAge',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'CORSMaxAgeEnabled',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{resourceId}.Properties.CorsConfiguration.MaxAge',
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'ProvisionCustomDomain',
        Value: true,
        CurrentValue: false,
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
            Type: 'AWS::ApiGatewayV2::DomainName',
            Properties: {
              DomainName: '%{SETTING:CustomDomain|ParameterToRef}',
              DomainNameConfigurations: [
                { CertificateArn: { Ref: '%{resourceId}SSLCertificate' } },
              ],
            },
            Condition: '%{resourceId}CustomDomain',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}CustomDomainMapping',
          Template: {
            Type: 'AWS::ApiGatewayV2::ApiMapping',
            Properties: {
              DomainName: { Ref: '%{resourceId}CustomDomain' },
              ApiId: { Ref: '%{resourceId}' },
              Stage: '$default',
            },
            Condition: '%{resourceId}CustomDomain',
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
        Setting: 'ProvisionCustomDomain',
        Value: false,
        CurrentValue: true,
      },
      Reactions: [
        { Type: 'Delete', Path: '$.Conditions.%{resourceId}CustomDomain' },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && @.Properties.DomainName === '%{SETTING:CustomDomain}')]",
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::DomainName' && @.Properties.DomainName === '%{SETTING:CustomDomain}')]",
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::ApiMapping' && @.Properties.ApiId.Ref === '%{resourceId}')]",
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'httpApi', Setting: 'CustomDomain' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            "$.Resources[?(@.Type === 'AWS::ApiGatewayV2::ApiMapping' && @.Properties.ApiId.Ref === '%{resourceId}')].Properties.DomainName.Ref",
            "$.Resources['%{value}'].Properties.DomainName",
          ],
          Transformations: ['ParameterToRef'],
          CreatePath: false,
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{currentValue}' || @.Properties.DomainName.Ref === %{currentValue|ParameterToParameterId}) :(@.Properties.DomainName === %{currentValue|JSONStringify})))].Properties.DomainValidationOptions['Fn::If'][1][0].DomainName",
          Transformations: ['ParameterToRef'],
          CreatePath: false,
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type === 'AWS::CertificateManager::Certificate' && (@.Properties.DomainName ?(@.Properties.DomainName === '%{currentValue}' || @.Properties.DomainName.Ref === %{currentValue|ParameterToParameterId}) :(@.Properties.DomainName === %{currentValue|JSONStringify})))].Properties.DomainName",
          Transformations: ['ParameterToRef'],
          CreatePath: false,
        },
        {
          Type: 'Upsert',
          Path: "$.Conditions.%{resourceId}CustomDomain['Fn::Not'][0]['Fn::Equals'][1]",
          Transformations: ['ParameterToRef'],
          CreatePath: false,
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: {
        ResourceType: 'httpApi',
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
        ResourceType: 'httpApi',
        FacetType: 'authorizer',
        Setting: 'IdentitySource',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].IdentitySource",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'httpApi',
        FacetType: 'authorizer',
        Setting: 'JWTIssuer',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.issuer",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'httpApi',
        FacetType: 'authorizer',
        Setting: 'JWTAudience',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.audience",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'httpApi',
        FacetType: 'authorizer',
        Setting: 'AuthorizationScopes',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].AuthorizationScopes",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'httpApi',
        FacetType: 'route',
        Setting: 'ProxyToHTTPService',
        Value: false,
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}'].parameters",
        },
      ],
    },
    {
      Action: 'UpdateFacetSetting',
      Conditions: {
        ResourceType: 'httpApi',
        FacetType: 'route',
        Setting: 'ProxyHTTPServiceLocation',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
          Template: {
            httpMethod: 'ANY',
            type: 'http_proxy',
            uri: '%{FACETSETTING:ProxyHTTPServiceLocation}',
            requestParameters:
              '%{FACETSETTING:ProxyHTTPServiceLocation|ApiRouteHttpProxyIntegrationParameters}',
            payloadFormatVersion: '1.0',
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources.%{resourceId}.Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}'].parameters",
          Transformations: ['ApiRouteHttpProxySwaggerParameters'],
        },
        {
          Type: 'Delete',
          Path: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'HttpApi' && @.Properties.Path === '%{FACET:Path|HttpApiDefaultRoutePrefix}' && @.Properties.Method === '%{FACET:Method}' && @.Properties.ApiId.Ref === '%{resourceId}')]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'httpApi',
        TargetType: 'userPoolClient',
        FacetType: 'authorizer',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: [
            '$.Resources.%{targetId}.Properties.UserPoolId.Ref',
            "$.Resources.%{sourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.issuer",
          ],
          Template: {
            'Fn::Sub':
              'https://cognito-idp.${AWS::Region}.amazonaws.com/${%{values[0]}}',
          },
        },
        {
          Type: 'Append',
          Path: "$.Resources.%{sourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.audience",
          Template: { Ref: '%{targetId}' },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'httpApi',
        TargetType: 'userPoolClient',
        FacetType: 'authorizer',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.Auth.Authorizers['%{FACET:Name}'].JwtConfiguration.audience[?(@.Ref === '%{targetId}')]",
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.Auth.Authorizers['%{FACET:Name}'][?(@.issuer && !@.audience)]",
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'httpApi',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}%{FACET:Method}%{FACET:Path|LogicalId}',
          Template: {
            Type: 'HttpApi',
            Properties: {
              Path: '%{FACET:Path|HttpApiDefaultRoutePrefix}',
              Method: '%{FACET:Method}',
              ApiId: { Ref: '%{sourceId}' },
              PayloadFormatVersion: '2.0',
              TimeoutInMillis: 29000,
            },
          },
        },
        {
          Type: 'Delete',
          Path: "$.Resources.%{sourceId}.Properties.DefinitionBody.paths['%{FACET:Path|HttpApiDefaultRoutePrefix}']['%{FACET:Method|ApiMethodIntegration}']['x-amazon-apigateway-integration']",
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'httpApi',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.Resources.%{targetId}.Properties.Events.%{integrationId}',
        },
      ],
    },
  ],
};
