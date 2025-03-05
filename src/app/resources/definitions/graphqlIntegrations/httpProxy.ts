export default {
  IntegrationTypes: [
    {
      SourceType: 'graphql',
      TargetType: 'httpProxy',
      FacetType: 'field',
      Locator: {
        Path: [
          "$.Resources[?(@.Type == 'AWS::AppSync::DataSource' && @.Properties.Type == 'HTTP')]",
          "$.Resources[?(@.Type == 'AWS::AppSync::Resolver' && @.Properties.DataSourceName['Fn::GetAtt'][0] == '%{key}')]",
        ],
        Source: { Path: '@.Properties.ApiId' },
        Target: {
          Path: [
            "@.Properties.DataSourceName['Fn::GetAtt'][0]",
            '$.Resources.%{value}',
          ],
          VirtualTargetType: 'httpProxy',
          VirtualTargetSettings: { Host: '@.Properties.HttpConfig.Endpoint' },
        },
        Facet: {
          Type: { Path: '@.Properties.TypeName' },
          Field: { Path: '@.Properties.FieldName' },
        },
      },
      SubResourceLocators: [
        {
          Path: [
            "@.Properties.DataSourceName['Fn::GetAtt'][0]",
            '$.Resources.%{value}',
          ],
        },
      ],
      ExclusiveResources: [
        "$.Resources[?(@.Type == 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] == '%{sourceId}' && @.Properties.TypeName == '%{FACET:Type}' && @.Properties.FieldName == '%{FACET:Field}')].Properties.DataSourceName['Fn::GetAtt'][0]",
      ],
    },
  ],
  Reactions: [
    {
      Action: 'AddIntegration',
      Conditions: {
        SourceType: 'graphql',
        TargetType: 'httpProxy',
        FacetType: 'field',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type == 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] == '%{sourceId}' && @.Properties.TypeName == '%{FACET:Type}' && @.Properties.FieldName == '%{FACET:Field}')]",
          Template: {
            Type: 'AWS::AppSync::Resolver',
            Properties: {
              TypeName: '%{FACET:Type}',
              DataSourceName: {
                'Fn::GetAtt': ['%{sourceId}To%{targetId}DataSource', 'Name'],
              },
              RequestMappingTemplate: '%{FACETSETTING:RequestMappingTemplate}',
              RequestMappingTemplateS3Location:
                '%{SOURCESETTING:SchemaLocation|AppSyncRequestLocation}',
              ResponseMappingTemplate:
                '%{FACETSETTING:ResponseMappingTemplate}',
              ResponseMappingTemplateS3Location:
                '%{SOURCESETTING:SchemaLocation|AppSyncResponseLocation}',
              ApiId: { 'Fn::GetAtt': ['%{sourceId}', 'ApiId'] },
              FieldName: '%{FACET:Field}',
            },
            DependsOn: '%{sourceId}Schema',
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}DataSource',
          Template: {
            Type: 'AWS::AppSync::DataSource',
            Properties: {
              Type: 'HTTP',
              ApiId: { 'Fn::GetAtt': ['%{sourceId}', 'ApiId'] },
              Name: '%{TARGETSETTING:Host|HttpProxyNameEscape}',
              HttpConfig: { Endpoint: '%{TARGETSETTING:Host}' },
            },
          },
        },
      ],
    },
    {
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'graphql',
        TargetType: 'httpProxy',
        FacetType: 'field',
      },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}LocalDataSource',
          Template: {
            Type: 'AWS::AppSync::DataSource',
            Properties: {
              Type: 'NONE',
              ApiId: { 'Fn::GetAtt': ['%{sourceId}', 'ApiId'] },
              Name: 'Local',
            },
          },
        },
        {
          Type: 'Upsert',
          Path: "$.Resources[?(@.Type == 'AWS::AppSync::Resolver' && @.Properties.ApiId['Fn::GetAtt'][0] == '%{sourceId}' && @.Properties.TypeName == '%{FACET:Type}' && @.Properties.FieldName == '%{FACET:Field}')].Properties.DataSourceName",
          Template: { 'Fn::GetAtt': ['%{sourceId}LocalDataSource', 'Name'] },
        },
      ],
    },
  ],
};
