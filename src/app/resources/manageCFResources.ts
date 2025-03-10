import * as query from './query';
import transformations from './transformations';

export const ERROR_CODES = {
  UNDEFINED_CONTEXT_KEY: 'undefinedContextKey',
};

export const intrinsicFunctionType = (value: any) => {
  if (!value || typeof value !== 'object' || Object.keys(value).length !== 1) {
    return null;
  }
  const [key] = Object.keys(value);
  if (key === 'Ref' || key.startsWith('Fn::')) {
    return key;
  }
  return null;
};

export const injectContext = (template: any, context: any) => {
  if (typeof template === 'string') {
    return contextReplace(template, context);
  }
};

const NATIVE_VALUE_CONTEXT_RE = /^%\{([^}]+)\}$/;
const CONTEXT_RE = /%\{([^}]+)\}/g;

const contextReplace = (string: string, context: any) => {
  const nativeMatch = string.match(NATIVE_VALUE_CONTEXT_RE);
  if (nativeMatch) {
    return transform(nativeMatch[1], context);
  } else {
    return string.replace(CONTEXT_RE, (_, spec) => transform(spec, context));
  }
};

const transform = (spec: string, context: any) => {
  const contextTransformations = spec.split('|');
  const key = contextTransformations.shift() as string;

  let queryPath = '$';

  for (const part of key.split('.')) {
    if (part.includes(':')) {
      queryPath += `["${part}"]`;
    } else {
      queryPath += `.${part}`;
    }
  }
  let value = query.value(queryPath, context, undefined, {});
  for (const transformation of contextTransformations) {
    let [_, transformationName, args] = (transformation.match(
      /^([^(]+)(?:\((.*)\))?$/,
    ) || []) as [string, string, any];
    args = args ? args.split(',').map((arg: any) => arg.trim()) : [];

    value = transformations[transformationName as keyof typeof transformations](
      value,
      context,
      args,
    );
    return value;
  }
};

export const DEFAULT_PARAMETERS = {
  StackTagName: {
    Type: 'String',
    Description: 'Stack Name (injected by Stackery at deployment time)',
  },
  EnvironmentTagName: {
    Type: 'String',
    Description: 'Environment Name (injected by Stackery at deployment time)',
  },
  EnvironmentAPIGatewayStageName: {
    Type: 'String',
    Description:
      'Environment name used for API Gateway Stage names (injected by Stackery at deployment time)',
  },
  DeploymentNamespace: {
    Type: 'String',
    Description:
      'Deployment Namespace (injected by Stackery at deployment time)',
  },
  DeploymentTimestamp: {
    Type: 'Number',
    Description:
      'Deployment preparation timestamp in milliseconds Since Epoch (injected by Stackery at deployment time)',
  },
  DefaultVPCId: {
    Type: 'AWS::EC2::VPC::Id',
    Description:
      'AWS account-specific default VPC ID (injected by Stackery at deployment time)',
  },
  DefaultVPCSubnets: {
    Type: 'List<AWS::EC2::Subnet::Id>',
    Description:
      'AWS account-specific default VPC subnets (injected by Stackery at deployment time)',
  },
  AmazonLinux2ImageId: {
    Type: 'AWS::EC2::Image::Id',
    Description:
      'Latest Amazon Linux 2 AMI ID (injected by Stackery at deployment time)',
  },
  SourceLocation: {
    Type: 'String',
    Description:
      'Location of source code for deployment (injected by Stackery at deployment time)',
  },
  SourceVersion: {
    Type: 'String',
    Description:
      'Source version for deployment (injected by Stackery at deployment time)',
  },
};
(DEFAULT_PARAMETERS as any)['StackeryStackTagName'] =
  DEFAULT_PARAMETERS.StackTagName;
(DEFAULT_PARAMETERS as any).StackeryEnvironmentTagName =
  DEFAULT_PARAMETERS.EnvironmentTagName;
(DEFAULT_PARAMETERS as any).StackeryEnvironmentAPIGatewayStageName =
  DEFAULT_PARAMETERS.EnvironmentAPIGatewayStageName;
(DEFAULT_PARAMETERS as any).StackeryDeploymentNamespace =
  DEFAULT_PARAMETERS.DeploymentNamespace;
(DEFAULT_PARAMETERS as any).StackeryDeploymentTimestamp =
  DEFAULT_PARAMETERS.DeploymentTimestamp;

export const findOwnerResourceId = (resourceId: any, resources: any): any => {
  for (const otherResourceId in resources) {
    const otherResource = resources[otherResourceId];

    if (otherResource.TemplatePartial.Resources.includes(resourceId)) {
      return otherResourceId;
    }
  }
};
