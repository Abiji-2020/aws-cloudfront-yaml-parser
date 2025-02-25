export default {
  ResourceTypes: {
    custom: {
      Settings: {
        CloudFormation: {
          Label: '',
          ValueType: 'object',
          InputType: 'yaml',
          Default: { Resources: { '%{resourceId}': {} } },
        },
      },
      DashboardProperties: {
        label: 'Anything',
        paletteLabel: 'Resource',
        paletteHint: 'Any SAM / CloudFormation Resource',
        paletteResource: 'Anything Resource',
        paletteInfo: 'This is a snippet of CloudFormation.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudformation-customresource.html',
        icon: 'custom.svg',
        info: 'Any SAM / CloudFormation Resource',
        deploymentProperties: { id: '%{resourceId}' },
      },
    },
  },
};
