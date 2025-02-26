export default {
  ResourceTypes: {
    secrets: {
      OnlyFormats: ['SAM'],
      IsImplicit: true,
      IsVirtualReferenceResource: true,
      SingletonId: 'Secrets',
      Settings: {},
      DashboardProperties: {
        label: 'Secrets',
        paletteLabel: 'Secrets',
        paletteHint: 'Provides access to Environment Secrets',
        paletteResource: 'AWS Secrets Manager',
        paletteInfo:
          'Use this resource to indicate which functions can access secrets.',
        paletteDocsLink:
          'https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-policy-templates.html',
        exclusive: true,
        icon: 'secret.svg',
        info: 'Grants access rights to secrets to functions and Docker tasks',
        inputs: 1,
        deploymentProperties: {
          name: 'Secrets',
          id: 'Secrets',
          arnLink:
            'https://console.aws.amazon.com/secretsmanager/home?region=%{region}#/listSecrets',
        },
      },
      DefaultReferences: [
        { SECRETS_REF: { Ref: '%{resourceId}' } },
        { SECRETS_NAMESPACE: { 'Fn::Sub': '/${EnvironmentTagName}/' } },
      ],
      DefaultPermissions: {
        SAMCapable: [{ PolicyName: 'AWSSecretsManagerGetSecretValuePolicy' }],
        IAMCapable: [{ Actions: ['secretsManager:GetSecretValue'] }],
      },
    },
  },
  PermissionTypes: {
    secrets: {
      SAM: {
        AWSSecretsManagerGetSecretValuePolicy: {
          SecretArn: {
            WithDependency: {
              'Fn::Sub':
                'arn:${AWS::Partition}:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:/${EnvironmentTagName}/*',
            },
          },
        },
      },
      Custom: {
        Actions: ['secretsManager:GetSecretValue'],
        Resources: {
          WithDependency: {
            'Fn::Sub':
              'arn:${AWS::Partition}:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:/${EnvironmentTagName}/*',
          },
        },
      },
    },
  },
};
