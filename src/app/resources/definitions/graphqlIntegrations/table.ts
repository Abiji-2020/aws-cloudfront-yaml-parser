export default {
  IntegrationTypes: [
    {
      SourceType: 'graphql',
      TargetType: 'table',
      FacetType: 'field',
      Locator: {
        Path: [
          "$.Resources[?(@.Type == 'AWS::AppSync::DataSource' && @.Properties.Type == 'AMAZON_DYNAMODB')]",
          "$.Resources[?(@.Type == 'AWS::AppSync::Resolver' && @.Properties.DataSourceName['Fn::GetAtt'][0] == '%{key}')]",
        ],
        Source: { Path: '@.Properties.ApiId' },
        Target: {
          Path: [
            "@.Properties.DataSourceName['Fn::GetAtt'][0]",
            '$.Resources.%{value}.Properties.DynamoDBConfig.TableName',
          ],
        },
        Facet: {
          Type: { Path: '@.Properties.TypeName' },
          Field: { Path: '@.Properties.FieldName' },
        },
      },
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
        TargetType: 'table',
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
              Type: 'AMAZON_DYNAMODB',
              ServiceRoleArn: {
                'Fn::GetAtt': ['%{sourceId}To%{targetId}AccessRole', 'Arn'],
              },
              ApiId: { 'Fn::GetAtt': ['%{sourceId}', 'ApiId'] },
              Name: '%{targetId}',
              DynamoDBConfig: {
                TableName: { Ref: '%{targetId}' },
                AwsRegion: { Ref: 'AWS::Region' },
              },
            },
          },
        },
        {
          Type: 'Upsert',
          Path: '$.Resources.%{sourceId}To%{targetId}AccessRole',
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
                'Fn::Sub':
                  '${AWS::StackName}-%{sourceId|MaxLength(9)}-to-%{targetId|MaxLength(9)}',
              },
              Policies: [
                {
                  PolicyName: 'Access',
                  PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                      {
                        Effect: 'Allow',
                        Action: [
                          'dynamodb:GetItem',
                          'dynamodb:PutItem',
                          'dynamodb:DeleteItem',
                          'dynamodb:UpdateItem',
                          'dynamodb:Query',
                          'dynamodb:Scan',
                          'dynamodb:BatchGetItem',
                          'dynamodb:BatchWriteItem',
                        ],
                        Resource: [
                          { 'Fn::GetAtt': ['%{targetId}', 'Arn'] },
                          { 'Fn::Sub': '${%{targetId}.Arn}/index/*' },
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
      Action: 'DeleteIntegration',
      Conditions: {
        SourceType: 'graphql',
        TargetType: 'table',
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
