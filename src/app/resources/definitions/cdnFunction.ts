export default {
  ResourceTypes: {
    cdnFunction: {
      Locator: "$.Resources[?(@.Type === 'AWS::CloudFront::Function')]",
      PhysicalNameBinding: '@.Properties.Name',
      Settings: {
        LogicalId: {
          Label: 'Logical ID',
          ValueType: 'logicalId',
          Description:
            'Updating this value will generate a new resource when this stack is redeployed',
          InputType: 'input',
        },
        Code: {
          Label: 'Code',
          Description: 'The source code of the function',
          ValueType: 'string',
          InputType: 'javascript',
          Path: '@.Properties.FunctionCode',
          Default:
            'function handler (event) {\n    // Insert function logic here.\n}',
        },
      },
      DashboardProperties: {
        UnavailableInFormats: ['serverless'],
        label: 'CDN Function',
        paletteLabel: 'CDN Function',
        paletteHint: 'CDN Function',
        paletteResource: 'CDN Function',
        paletteInfo:
          'Use this resource type to declare an AWS CloudFront Function.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudfront-function.html',
        inputs: 1,
        outputs: 0,
        icon: 'cdn.svg',
        info: 'Executes code for each request or response to a CDN',
        deploymentProperties: {
          arn: 'arn:aws:cloudfront::%{awsAccountId}:function/%{physicalId}',
          arnLink:
            'https://console.aws.amazon.com/cloudfront/v2/home#/functions/edit',
          name: '%{SETTING:Name}',
          id: '%{resourceId}',
          settings: [{ label: 'Logical ID', value: '%{resourceId}' }],
          consoleLinks: [
            {
              label: 'Invocation Metrics',
              type: 'cloudwatchChartLink',
              title:
                "Invocation Metrics For CDN Function '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: 'us-east-1',
              namespace: 'AWS/CloudFront',
              dimensions: ['FunctionName', 'Region'],
              metrics: [
                {
                  label: 'Invocations',
                  namespace: 'AWS/CloudFront',
                  name: 'FunctionInvocations',
                  statistic: 'Sum',
                  dimensions: {
                    FunctionName: '%{physicalId}',
                    Region: 'Global',
                  },
                },
                {
                  label: 'Validation Errors',
                  namespace: 'AWS/CloudFront',
                  name: 'FunctionValidationErrors',
                  statistic: 'Sum',
                  dimensions: {
                    FunctionName: '%{physicalId}',
                    Region: 'Global',
                  },
                },
                {
                  label: 'Execution Errors',
                  namespace: 'AWS/CloudFront',
                  name: 'FunctionExecutionErrors',
                  statistic: 'Sum',
                  dimensions: {
                    FunctionName: '%{physicalId}',
                    Region: 'Global',
                  },
                },
              ],
            },
            {
              label: 'Compute Utilization',
              type: 'cloudwatchChartLink',
              title:
                "Compute Utilization For Function '%{name}' From Stack '%{stackName}' Environment '%{environmentName}'",
              region: 'us-east-1',
              namespace: 'AWS/CloudFront',
              dimensions: ['FunctionName', 'Region'],
              metrics: [
                {
                  label: 'Utilization',
                  namespace: 'AWS/CloudFront',
                  name: 'FunctionComputeUtilization',
                  dimensions: {
                    FunctionName: '%{physicalId}',
                    Region: 'Global',
                  },
                },
              ],
            },
            {
              label: 'Logs',
              type: 'cloudwatchLogsLink',
              region: 'us-east-1',
              logGroup: '/aws/cloudfront/function/%{physicalId}',
            },
          ],
        },
      },
      Metrics: {
        namespace: 'AWS/CloudFront',
        metrics: [
          {
            type: 'Invocations',
            unit: 'Count',
            factors: { a: 'FunctionInvocations' },
          },
          {
            type: 'Errors',
            unit: 'Count',
            factors: { a: 'FunctionValidationErrors' },
          },
          {
            type: 'Errors',
            unit: 'Count',
            factors: { a: 'FunctionExecutionErrors' },
          },
          {
            type: 'Compute Utilization',
            unit: 'CPUUtilization',
            factors: { a: 'FunctionComputeUtilization' },
          },
        ],
        dimensions: [
          { name: 'FunctionName', value: '%{physicalId}' },
          { name: 'Region', value: 'Global' },
        ],
      },
      DefaultReferences: [
        { CDN_FUNCTION_ARN: { 'Fn::GetAtt': ['%{resourceId}', 'Arn'] } },
      ],
    },
  },
  Reactions: [
    {
      Action: 'AddResource',
      Conditions: { ResourceType: 'cdnFunction' },
      Reactions: [
        {
          Type: 'Upsert',
          Path: '$.Resources.%{resourceId}',
          Template: {
            Type: 'AWS::CloudFront::Function',
            Properties: {
              AutoPublish: true,
              FunctionCode: '%{SETTING:Code}',
              FunctionConfig: { Comment: '', Runtime: 'cloudfront-js-1.0' },
              Name: { 'Fn::Sub': '${AWS::StackName}-%{resourceId}' },
            },
          },
        },
      ],
    },
    {
      Action: 'UpdateResourceSetting',
      Conditions: { ResourceType: 'cdnFunction', Setting: 'Code' },
      Reactions: [
        {
          Type: 'Upsert',
          CreatePath: false,
          Path: '$.Resources.%{resourceId}.Properties.FunctionCode',
        },
      ],
    },
  ],
};
