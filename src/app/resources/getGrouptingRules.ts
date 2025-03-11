import * as definitions from './definitions';

const globalRules = [
  {
    sourceType: '^(?!AWS::IAM::Role|Custom::).*$',
    targetType: 'AWS::IAM::Role',
    stopChaining: true,
  },
  {
    sourceType: 'AWS::IAM::ManagedPolicy',
    targetType: 'AWS::IAM::Role',
  },
  {
    sourceType: '.*',
    targetType: 'AWS::IAM::InstanceProfile',
  },
  {
    sourceType: 'AWS::IAM::InstanceProfile',
    targetType: 'AWS::IAM::Role',
  },
  {
    sourceType: '.*',
    targetType: 'AWS::Logs::*',
  },
  {
    sourceType: 'AWS::IAM::Role',
    targetType: 'AWS::Cognito::IdentityPool',
  },
  {
    sourceType: 'AWS::ApiGateway::RestApi',
    targetType: 'AWS::IAM::Role',
  },
  {
    sourceType: 'AWS::Cognito::IdentityPoolRoleAttachment',
    targetType: 'AWS::Cognito::IdentityPool',
  },
  {
    sourceType: 'AWS::Cognito::UserPoolGroup',
    targetType: 'AWS::Cognito::UserPool',
  },
  {
    sourceType: 'Custom::.*',
    targetType: 'AWS::Lambda::Function',
  },
  {
    sourceType: 'AWS::Lambda::Permission',
    targetType: '^(?!AWS::(Lambda|Serverless)::Function).*$',
  },
  {
    sourceType: 'AWS::ElasticBeanstalk::*',
    targetType: 'AWS::ElasticBeanstalk::Application',
  },
  {
    sourceType: 'AWS::SSM::Parameter',
    targetType: '.*',
  },
];

let _rules = {};
export default function getGroupingRules(format: 'SAM' | 'serverless') {
  if ((_rules as any)[format]) {
    return (_rules as any)[format];
  }
  let rules = [...globalRules];

  const groupingRules = definitions[format].GroupingRules;
  rules = groupingRules ? rules.concat(groupingRules) : rules;

  (_rules as any)[format] = rules;

  return rules;
}
