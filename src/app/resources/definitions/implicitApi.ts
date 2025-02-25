export default {
  ResourceTypes: {
    implicitApi: {
      IsImplicit: true,
      SingletonId: {
        Format: { SAM: 'ServerlessRestApi', serverless: 'ApiGatewayRestApi' },
      },
      PhysicalNameBinding: {
        Format: { SAM: null, serverless: '$.provider.apiName' },
      },
      SingletonName: 'Implicit Api',
      Locator: {
        Format: {
          SAM: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'Api' && !@.Properties.RestApiId)]",
          serverless: '$.functions[*].events[?(@.http)]',
        },
      },
      Settings: {
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
              Choices: ['HEAD', 'GET', 'PUT', 'POST', 'DELETE', '*'],
            },
            { Label: 'Path', ValueType: 'string', InputType: 'input' },
          ],
          FacetType: 'route',
          Default: [{ Method: 'GET', Path: '/' }],
          Path: { Format: { SAM: '@.Properties', serverless: '@.http' } },
          Transformations: {
            Format: {
              SAM: ['SAMImplicitApiRoutes'],
              serverless: ['ServerlessImplicitApiRoutes'],
            },
          },
        },
      },
      DashboardProperties: {
        hideFromPalette: { Format: { SAM: true, serverless: false } },
        exclusive: true,
        label: 'Api',
        paletteLabel: 'Rest Api',
        paletteHint: 'Api Gateway',
        paletteResource: 'AWS::Serverless::Api',
        paletteInfo:
          'Use this resource type to declare a collection of implicit Amazon API Gateway resources and methods that can be invoked through HTTPS endpoints.',
        paletteDocsLink: 'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-api.html',
        icon: 'rest-api.svg',
        info: 'Executes a function for each HTTP request',
        initialWidth: 140,
        initialHeight: 90,
        zIndex: -50,
        facetLabels: { route: '%{FACET:Method} %{FACET:Path}' },
        deploymentProperties: {
          arn: 'arn:aws:apigateway:%{region}::/restapis/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/apigateway/home?region=%{region}#/apis/%{physicalId}/resources',
          settings: [
            { label: 'Logical ID', value: '%{resourceId}' },
            {
              label: 'Stage Location',
              href: 'https://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}',
              value:
                'https://%{physicalId}.execute-api.%{region}.amazonaws.com/%{INFO:stageDomainName}',
              type: 'link',
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
    },
  },
  IntegrationTypes: [
    {
      SourceType: 'implicitApi',
      TargetType: 'function',
      FacetType: 'route',
      Locator: {
        Path: {
          Format: {
            SAM: "$.Resources[?(@.Type === 'AWS::Serverless::Function')].Properties.Events[?(@.Type === 'Api' && !@.Properties.RestApiId)]",
            serverless: '$.functions[*].events[?(@.http)]',
          },
        },
        Source: {
          Format: { SAM: 'ServerlessRestApi', serverless: 'ApiGatewayRestApi' },
        },
        Target: { Index: 2 },
        Facet: {
          Path: {
            Path: {
              Format: { SAM: '@.Properties.Path', serverless: '@.http.path' },
            },
          },
          Method: {
            Path: {
              Format: {
                SAM: '@.Properties.Method',
                serverless: '@.http.method',
              },
            },
            Transformations: ['Uppercase'],
          },
        },
      },
    },
  ],
  Reactions: [
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'implicitApi',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{targetId}.Properties.Events.%{sourceId}%{FACET:Method}%{FACET:Path|LogicalId}',
          Template: {
            Type: 'Api',
            Properties: { Path: '%{FACET:Path}', Method: '%{FACET:Method}' },
          },
        },
      ],
    },
    {
      Action: 'AddIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'implicitApi',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Append',
          Path: '$.functions["%{serverlessFunctionId}"].events',
          Template: {
            http: { path: '%{FACET:Path}', method: '%{FACET:Method}' },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        Format: 'SAM',
        SourceType: 'implicitApi',
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
    {
      Action: 'DeleteIntegration',
      Conditions: {
        Format: 'serverless',
        SourceType: 'implicitApi',
        TargetType: 'function',
        FacetType: 'route',
      },
      Reactions: [
        {
          Type: 'Delete',
          Path: '$.functions["%{serverlessFunctionId}"].events[%{integrationId}]',
        },
      ],
    },
  ],
};
