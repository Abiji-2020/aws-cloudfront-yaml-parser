import { dirname } from 'path-browserify';
import cloneDeep from 'clone-deep';
import { intrinsicFunctionType, DEFAULT_PARAMETERS } from './manageCFResources';
import Parameter from './parameter';
import { buildSchema, graphqlSync } from 'graphql';

const INVALID_TAG_CHARACTERS_RE = /[^\sa-zA-Z0-9+=._:/-]/g;
const WHITESPACE_RE = /\s+/g;
const LOG_GROUP_RE = /[^a-zA-Z0-9_-]/g;
const GRAPHQL_FIELDS_QUERY = `{
    __schema {
      types {
        name
        kind
  
        fields {
          name
        }
      }
    }
  }`;
const GRAPHQL_AWS_DEFINITIONS = `
scalar AWSDate
scalar AWSTime
scalar AWSDateTime
scalar AWSTimestamp
scalar AWSEmail
scalar AWSJSON
scalar AWSURL
scalar AWSPhone
scalar AWSIPAddress

directive @aws_api_key on OBJECT | FIELD_DEFINITION
directive @aws_auth(cognito_groups: [String]) on FIELD_DEFINITION
directive @aws_cognito_user_pools(cognito_groups: [String]) on OBJECT | FIELD_DEFINITION
directive @aws_iam on OBJECT | FIELD_DEFINITION
directive @aws_oidc on OBJECT | FIELD_DEFINITION
directive @aws_publish(subscriptions: [String]) on FIELD_DEFINITION
directive @aws_subscribe(mutations: [String]) on FIELD_DEFINITION

`;
const HTTP_PROXY_NAME_RE = /[^a-zA-Z0-9_]/g;
const REMOTE_FILE_RE = /^(s3|http|https):\/\//;

const transformations = {
  Uppercase: (value: string) => value.toUpperCase(),
  Lowercase: (value: string) => value.toLowerCase(),
  UppercaseFirstLetter: (value: any) => value[0].toUpperCase() + value.slice(1),
  MaxLength: (value: any, length: any, args: any) => {
    const maxLength = Number(args[0]);
    return value.slice(0, maxLength);
  },
  LogicalId: (value: any) => value.replace(/[^A-Za-z0-9]/g, ''),
  LogicalIdFromReferecne: (ref: any) =>
    ref !== null && typeof ref === 'object' ? ref.Ref : ref,
  Boolean: (value: any) => {
    if (
      intrinsicFunctionType(value) === 'Ref' &&
      !(value.Ref in DEFAULT_PARAMETERS)
    ) {
      return value;
    }
    return !!value;
  },
  Not: (value: any) => !value,
  JSONParse: (value: any) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  JSONStringify: (value: any) => {
    if (
      intrinsicFunctionType(value) === 'Ref' &&
      !(value.Ref in DEFAULT_PARAMETERS)
    ) {
      return value;
    }
    return JSON.stringify(value);
  },
  NullToEmptyString: (value: any) => (value === null ? '' : value),
  NullToFalseString: (value: any) => (value === null ? 'false' : value),
  ToString: (value: any) => {
    if (intrinsicFunctionType(value) === 'Ref') {
      return value;
    }
    return value.toString();
  },
  ParseNumber: (value: any) => Number(value),
  TagEscape: (value: any) =>
    value.replace(INVALID_TAG_CHARACTERS_RE, '').replace(WHITESPACE_RE, ' '),
  LogGroupEscape: (value: any) => value.replace(LOG_GROUP_RE, '-'),
  ToNameValue: (map: any) =>
    map ? Object.keys(map).map((Name) => ({ Name, Value: map[Name] })) : [],
  FromNameValue: (array: any) =>
    array === null || array === undefined
      ? null
      : array.reduce((map: any, item: any) => {
          map[item.Name] = item.Value;
          return map;
        }, {}),
  FunctionRuntime: (resource: any) => {
    let runtime;
    let metadata;
    if ('Properties' in resource) {
      runtime = resource.Properties.Runtime;
      if ('Metadata' in resource) {
        metadata = resource.Metadata;
      }
    } else if ('runtime' in resource) {
      if ('tags' in resource) {
        metadata = resource.tags;
      }
    }
    let runtimeOption;
    if (metadata) {
      if ('RuntimeOption' in metadata) {
        runtimeOption = metadata.RuntimeOption;
      } else if ('runtimeOption' in metadata) {
        runtimeOption = metadata.runtimeOption;
      }
    }
    if (runtimeOption) {
      return `${runtime} (${runtimeOption})`;
    } else return runtime;
  },
  DatabasePort: (engine: any) => {
    switch (engine) {
      case 'mariadb':
      case 'mysql':
      case 'aurora':
      case 'aurora-mysql':
        return 3306;
      case 'aurora-postgresql':
      case 'postgres':
        return 5432;
      case 'sqlserver-ex':
      case 'sqlserver-web':
      case 'sqlserver-se':
      case 'sqlserver-ee':
        return 1433;
      default:
        throw new Error(
          `Failed to transform RDS engine to port: Unknown engine type '${engine}'`,
        );
    }
  },
  TopicNameFromArn: (arn: any) => arn.split(':').pop(),
  DynamoDBKeyTypeToString: (type: any) => {
    switch (type) {
      case 'S':
        return 'String';
      case 'N':
        return 'Number';
      case 'B':
        return 'Binary';
      default:
        return type;
    }
  },
  NameFromECSTaskArn: (arn: any) => arn.split('/').pop().split(':')[0],
  NameShortFromECSTaskArn: (arn: any) =>
    arn
      .split('/')
      .pop()
      .split(':')[0]
      .replace(/-[^-]+$/, ''),
  NumberFromECSTaskArn: (arn: any) => arn.split('/').pop().split(':')[1],
  CustomStacksDomain: (domain: any, context: any) =>
    domain || `${context.resourceId}${context.namespace}.com`,
  NameFromSQSPhysicalId: (domain: any) => domain.split('/').pop(),

  ApiRoutesFromSwagger: (paths: any) => {
    const routes = [];
    for (let Path in paths) {
      for (const Method in paths[Path]) {
        if (paths[Path][Method].isDefaultRoute) {
          Path = '$default';
        }
        routes.push({
          Path,
          Method:
            Method === 'x-amazon-apigateway-any-method'
              ? 'ANY'
              : Method.toUpperCase(),
        });
      }
    }
    return routes;
  },
  ApiRoutesToSwagger: (routes: any, context: any) => {
    const swaggerPaths = context.currentTemplate
      ? cloneDeep(
          context.currentTemplate.Resources[context.resourceId].Properties
            .DefinitionBody.paths || {},
        )
      : {};
    const currentRoutes = context.currentValue || [];

    for (const route of routes) {
      const method =
        route.Method === 'ANY'
          ? 'x-amazon-apigateway-any-method'
          : route.Method.toLowerCase();
      const path = route.Path === '$default' ? '/$default' : route.Path;
      swaggerPaths[path] = swaggerPaths[path] || {};
      swaggerPaths[path][method] = swaggerPaths[path][method] || {
        responses: {},
      };

      if (route.Method === 'ANY' && route.Path === '$default') {
        swaggerPaths[path][method].isDefaultRoute = true;
      } else {
        delete swaggerPaths[path][method].isDefaultRoute;
      }
    }

    for (const currentRoute of currentRoutes) {
      if (
        !routes.some(
          (route: any) =>
            route.Method === currentRoute.Method &&
            route.Path === currentRoute.Path,
        )
      ) {
        const method =
          currentRoute.Method === 'ANY'
            ? 'x-amazon-apigateway-any-method'
            : currentRoute.Method.toLowerCase();
        const path =
          currentRoute.Path === '$default' ? '/$default' : currentRoute.Path;
        delete swaggerPaths[path][method];
        if (Object.keys(swaggerPaths[path]).length === 0) {
          delete swaggerPaths[path];
        }
      }
    }
    return swaggerPaths;
  },
  HttpApiDefaultRoutePrefix: (path: any) =>
    path === '/$default' ? '/$default' : path,
  HttpApiDefaultRouteWithoutPrefix: (path: any) =>
    path === '/$default' ? '$default' : path,
  ApiRouteHttpProxyFromSwagger: (type: any) => type === 'http_proxy',
  ApiRouteHttpProxySwaggerParamters: (uri: any) => {
    if (typeof uri === 'string') {
      const match = uri.match(/\{([^}]+)\}/);
      if (match) {
        const proxyName = match[1];
        return [
          {
            name: proxyName,
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ];
      }
    }
    return null;
  },
  ApiRouteHttpProxyIntegrationParameters: (uri: any) => {
    if (typeof uri === 'string') {
      const match = uri.match(/\{([^}]+)\}/);

      if (match) {
        const proxyName = match[1];

        return {
          [`integration.request.path.${proxyName}`]: `method.request.path.${proxyName}`,
        };
      }
    }
    return null;
  },
  ApiMethodIntegration: (method: any) =>
    method === 'ANY' ? 'x-amazon-apigateway-any-method' : method.toLowerCase(),
  HttpApiAuthorizersFromTemplate: (authorizers: any) =>
    Object.keys(authorizers).map((Name) => ({ Name })),
  SAMImplicitApiRoutes: (props: any) => [
    {
      Method: props.Method.toUpperCase(),
      Path: props.Path,
    },
  ],
  IntervalTypeFromSchedule: (schedule: any) => {
    if (typeof schedule === 'object') {
      if (
        !schedule ||
        Object.keys(schedule).length > 1 ||
        !('rate' in schedule)
      ) {
        return 'CloudWatch Schedule Expression';
      }

      schedule = schedule.rate;
    }

    return schedule.startsWith('rate(') ? 'Interval' : 'Cron Expression';
  },
  IntervalValueFromSchedule: (schedule: any) => {
    if (typeof schedule === 'object') {
      if (
        !schedule ||
        Object.keys(schedule).length > 1 ||
        !('rate' in schedule)
      ) {
        return 1;
      }

      schedule = schedule.rate;
    }

    return Number(schedule.replace(/^rate\((.*) .*\)$/, '$1'));
  },
  IntervalUnitFromSchedule: (schedule: any) => {
    if (typeof schedule === 'object') {
      if (
        !schedule ||
        Object.keys(schedule).length > 1 ||
        !('rate' in schedule)
      ) {
        return 'minutes';
      }

      schedule = schedule.rate;
    }

    let unit = schedule.replace(/^rate\(.* (.*)\)$/, '$1');

    // Pluralize unit if needed
    if (!unit.endsWith('s')) {
      unit = unit + 's';
    }

    return unit[0].toUpperCase() + unit.slice(1);
  },
  CronExpressionFromSchedule: (schedule: any) => {
    if (typeof schedule === 'object') {
      if (
        !schedule ||
        Object.keys(schedule).length > 1 ||
        !('rate' in schedule)
      ) {
        return '* * * * ? *';
      }

      schedule = schedule.rate;
    }

    return schedule.replace(/^cron\((.*)\)$/, '$1');
  },
  ScheduleExpression: (_: any, context: any) => {
    let scheduleType;
    let unit;
    let value;
    let cronExpression;
    let scheduleExpression;

    /* When updating settings, SETTING namespace is used. When adding an
     * integration, SOURCESETTING namespace is used. */
    if ('SETTING:ScheduleType' in context) {
      scheduleType = context['SETTING:ScheduleType'];
      unit = context['SETTING:IntervalUnit'].toLowerCase();
      value = context['SETTING:IntervalValue'];
      cronExpression = context['SETTING:CronExpression'];
      scheduleExpression = context['SETTING:ScheduleExpression'];
    } else {
      scheduleType = context['SOURCESETTING:ScheduleType'];
      unit = context['SOURCESETTING:IntervalUnit'].toLowerCase();
      value = context['SOURCESETTING:IntervalValue'];
      cronExpression = context['SOURCESETTING:CronExpression'];
      scheduleExpression = context['SOURCESETTING:ScheduleExpression'];
    }

    if (scheduleType === 'Interval') {
      if (value === 1) {
        unit = unit.slice(0, unit.length - 1);
      }

      return `rate(${value} ${unit})`;
    } else if (scheduleType === 'Cron Expression') {
      return `cron(${cronExpression})`;
    } else {
      if (scheduleExpression instanceof Parameter) {
        return scheduleExpression.reference();
      } else {
        return scheduleExpression;
      }
    }
  },
  ServerlessImplicitApiRoutes: (props: any) => [
    {
      Method: props.method.toUpperCase(),
      Path: props.path,
    },
  ],
  ServerlessS3EventName: (props: any) =>
    typeof props === 'string' ? props : props.bucket,
  ServerlessEventSourceName: (resourceId: any) => {
    if (resourceId.startsWith('S3Bucket')) {
      resourceId = resourceId.substring('S3Bucket'.length);
    } else if (resourceId.startsWith('SNSTopic')) {
      resourceId = resourceId.substring('SNSTopic'.length);
    }
    return resourceId[0].toLowerCase() + resourceId.slice(1);
  },
  ServerlessSnsTopicName: (props: any) =>
    typeof props === 'string' ? props : props.topicName,
  ServerlessSnsTopicResourceId: (topicName: any) =>
    `SNSTopic${topicName[0].toUpperCase()}${topicName.slice(1)}`,
  ServerlessSqsQueueResourceId: (props: any) =>
    typeof props === 'string' ? props : props.arn,

  GraphQLApiIdFromArn: (arn: any) => arn.replace(/^.*\//, ''),
  GraphQLFieldsFromSchema: (schema: any) => {
    if (!schema) {
      return [];
    }

    const schemaAST = buildSchema(schema);
    const { data } = graphqlSync({
      schema: schemaAST,
      source: GRAPHQL_FIELDS_QUERY,
    });

    if (!data) {
      return [];
    }

    const { queryType, mutationType } = data['__schema'] as any;

    const queryFields = queryType
      ? queryType.fields.map((field: any) => ({
          Type: queryType.name,
          Field: field.name,
        }))
      : [];
    const mutationFields = mutationType
      ? mutationType.fields.map((field: any) => ({
          Type: mutationType.name,
          Field: field.name,
        }))
      : [];

    return queryFields.concat(mutationFields);
  },
  GraphQLFieldChoices: (schema: any) => {
    let schemaAST;
    try {
      // Add AWS AppSync specific scalars
      const schemaWithAWSTypes = GRAPHQL_AWS_DEFINITIONS + schema;

      schemaAST = buildSchema(schemaWithAWSTypes);
    } catch (err) {
      // Failed to parse schema
      return [];
    }

    const { data } = graphqlSync({
      schema: schemaAST,
      source: GRAPHQL_FIELDS_QUERY,
    });
    if (!data) {
      return [];
    }

    const types = (data as any)['__schema'].types.filter(
      (type: any) => !type.name.startsWith('__') && type.kind === 'OBJECT',
    );

    const choices = [];

    for (const type of types) {
      for (const field of type.fields) {
        choices.push({
          Label: `${type.name} ${field.name}`,
          Value: {
            Type: type.name,
            Field: field.name,
          },
        });
      }
    }

    return choices;
  },
  IsLocalFile: (location: any) =>
    typeof location === 'string' && !REMOTE_FILE_RE.test(location),
  AppSyncRequestLocation: (schemaLocation: any, context: any) =>
    `${dirname(schemaLocation)}/${context['FACET:Type']}-${context['FACET:Field']}-request.vm`,
  AppSyncResponseLocation: (schemaLocation: any, context: any) =>
    `${dirname(schemaLocation)}/${context['FACET:Type']}-${context['FACET:Field']}-response.vm`,
  HttpProxyNameEscape: (host: any) => {
    if (typeof host === 'string') {
      return host.replace(HTTP_PROXY_NAME_RE, '_');
    } else if (typeof host === 'object' && 'Ref' in host) {
      // This is likely a reference to a template parameter, use the parameter name as it must also
      // be alphanumeric.
      return host.Ref.replace(/^EnvConfig/, '').replace(/AsString$/, '');
    } else {
      // TODO: This will probably fail, but we need to return something...
      return host;
    }
  },
  ServerlessFunctionId: (resourceId: any) => {
    const s = resourceId.replace(/LambdaFunction$/, '');
    return s[0].toLowerCase() + s.slice(1);
  },
  PrivateApiFromTemplate: (endpointConfiguration: any) =>
    endpointConfiguration === 'PRIVATE',
  PrivateApiToTemplate: (isPrivate: any) =>
    isPrivate ? 'PRIVATE' : 'REGIONAL',

  RDSArnType: (type: any) =>
    type === 'AWS::RDS::DBCluster' ? 'cluster' : 'db',
  RDSIsCluster: (type: any) => type === 'AWS::RDS::DBCluster',
  RDSMetricDimension: (type: any) =>
    type === 'AWS::RDS::DBCluster'
      ? 'DBClusterIdentifier'
      : 'DBInstanceIdentifier',

  WebSocketRouteToIntegrationLogicalId: (target: any) => {
    if ('Fn::Sub' in target) {
      return target['Fn::Sub'].replace(/.*\$\{(.*)\}.*/, '$1');
    } else {
      return target['Fn::Join'][1][1].Ref;
    }
  },
  ApiGatewayIntegrationUriToLambdaReference: (uri: any) => {
    const target = uri['Fn::Sub'];
    if (!target) {
      return uri;
    }

    const referenceLambdaByArn = /.*\$\{(.*)\.Arn\}.*/;
    let found = target.match(referenceLambdaByArn);
    if (found) {
      return { Ref: found[1] };
    }

    const referenceLambdaByAlias = /.*\$\{(.*)Alias.*\}\.*/;
    found = target.match(referenceLambdaByAlias);
    if (found) {
      return { Ref: found[1] };
    }
    return null;
  },
  // If the input is a Parameter object, return a Ref to the ParameterId.  Otherwise return
  // the input.
  ParameterToRef: (param: any) =>
    param instanceof Parameter ? param.reference() : param,
  // If the input is a parameter, return the ParameterId; otherwise return the input with
  // the effect of NullToEmptyString included.  The result is returned with explicit quoting,
  // otherwise jsonpath won't recognize it as a string.
  ParameterToParameterId: (param: any) => {
    const result = param instanceof Parameter ? param.ParameterId : param || '';
    return `'${result}'`;
  },
  BucketWebsiteEndpoint: (region: any) => {
    // Check if the website endpoint for that region uses a `.` or `-`
    const dotRegions = [
      'us-east-2',
      'ap-east-1',
      'ap-south-1',
      'ap-northeast-3',
      'ap-northeast-2',
      'ca-central-1',
      'cn-northwest-1',
      'eu-central-1',
      'eu-west-2',
      'eu-west-3',
      'eu-north-1',
      'me-south-1',
    ];
    if (dotRegions.includes(region)) {
      return `.${region}`;
    } else {
      return `-${region}`;
    }
  },
  ToPercent: (value: any) =>
    typeof value === 'number' ? (Number(value) * 100).toFixed(0) : value,
  FromPercent: (value: any) =>
    typeof value === 'number' ? Number(value) / 100 : value,
  Default: (value: any, context: any, args: any) =>
    value != null ? value : args[0],

  // Convert the Physical ID of an AWS::Serverless::LayerVersion, which is just the version ARN, to
  // the form that is needed for a link to the layer in the Lambda console. The input is the layer
  // version ARN, so we need to split off the layer name and version.
  LayerLink: (value: any) => {
    const match = value.match(/.+:([^:]+:[0-9]+)/);
    if (match) {
      return match[1].replace(':', '/versions/');
    }
    return value;
  },
  LambdaLayerDeletePreviousVersion: (value: any) => value === 'Delete',

  // Search a state machine definition recursively, extracting StateIds for each 'Task' state. The
  // generated StateIds must be unique, and components are included for parallel and map states.
  TaskResourcesFromStateMachineDefinition: (
    definition: any,
    prefix: any,
  ): any => {
    if (
      !definition ||
      !definition.States ||
      typeof definition.States !== 'object'
    ) {
      return [];
    }

    const taskResources = [];
    for (const [stateId, state] of Object.entries(definition.States)) {
      switch ((state as any).Type) {
        case 'Task': {
          const Resource = transformations.CleanResourceName(state);
          const StateId = prefix ? `${prefix}.${stateId}` : stateId;
          taskResources.push({
            StateId,
            Resource,
            props: { StateId },
          });
          break;
        }
        case 'Parallel':
          if (
            !(state as any).Branches ||
            !Array.isArray((state as any).Branches)
          ) {
            break;
          }
          for (let i = 0; i < (state as any).Branches.length; ++i) {
            const branch = (state as any).Branches[i];
            const pfx = prefix
              ? `${prefix}.${stateId}.${i}`
              : `${stateId}.${i}`;
            const branchResources =
              transformations.TaskResourcesFromStateMachineDefinition(
                branch,
                pfx,
              );
            taskResources.push(...branchResources);
          }
          break;
        case 'Map': {
          if (!(state as any).Iterator) {
            break;
          }
          const pfx = prefix ? `${prefix}.${stateId}` : `${stateId}`;
          const mapResources =
            transformations.TaskResourcesFromStateMachineDefinition(
              (state as any).Iterator,
              pfx,
            );
          taskResources.push(...mapResources);
          break;
        }
        default:
          break;
      }
    }

    return taskResources;
  },
  // Convert a state machine StateId to the jsonspath string identifying that task state. This mostly
  // means inserting 'States', 'Branches', and 'Iterator' path components appropriately.
  JsonPathFromStateId: (stateId: any, context: any) => {
    let stateDefinition =
      context['SOURCESETTING:Definition'] ||
      // When doing dockerTask.DeleteVirtualNetworkPlacement, we'll find the state machine definintion
      // in value[0].Properties...
      (context.values[0].Properties &&
        context.values[0].Properties.Definition) ||
      context.value;
    let path;

    for (const split of stateId.split('.')) {
      if (stateDefinition.States) {
        const splitComponent = split.includes(' ')
          ? `["${split}"]`
          : `.${split}`;
        path = path
          ? `${path}.States${splitComponent}`
          : `States${splitComponent}`;
        stateDefinition = stateDefinition.States[split];
      } else if (stateDefinition.Iterator) {
        const splitComponent = split.includes(' ')
          ? `["${split}"]`
          : `.${split}`;
        path = path
          ? `${path}.Iterator.States${splitComponent}`
          : `Iterator.States${splitComponent}`;
        stateDefinition = stateDefinition.Iterator.States[split];
      } else if (stateDefinition.Branches && split.match(/^[0-9]+$/)) {
        const index = parseInt(split, 10);
        path = path ? `${path}.Branches[${split}]` : `Branches[${split}]`;
        stateDefinition = stateDefinition.Branches[index];
      } else {
        console.log(`Error expanding state ID: ${stateId}, ${stateDefinition}`);
      }
    }
    return path;
  },

  // Extract a resource name from a state machine task state and remove dollar-curly-bracket decorations
  CleanResourceName: (value: any) => {
    if (!value.Resource) {
      return null;
    }

    // The various services that can be invoked from state machines allow different invocation styles:
    // https://docs.aws.amazon.com/step-functions/latest/dg/concepts-service-integrations.html
    // The resource is found in different properties accordingly.
    let resource;
    switch (value.Resource) {
      case 'arn:aws:states:::apigateway:invoke':
        resource = value.Parameters && value.Parameters.ApiEndpoint;
        break;
      case 'arn:aws:states:::ecs:runTask':
      case 'arn:aws:states:::ecs:runTask.sync':
      case 'arn:aws:states:::ecs:runTask.waitForTaskToken':
        resource = value.Parameters && value.Parameters.TaskDefinition;
        break;
      case 'arn:aws:states:::dynamodb:deleteItem':
      case 'arn:aws:states:::dynamodb:getItem':
      case 'arn:aws:states:::dynamodb:putItem':
      case 'arn:aws:states:::dynamodb:updateItem':
        resource = value.Parameters && value.Parameters.TableName;
        break;
      case 'arn:aws:states:::lambda:invoke':
      case 'arn:aws:states:::lambda:invoke.waitForTaskToken':
        resource = value.Parameters && value.Parameters.FunctionName;
        break;
      case 'arn:aws:states:::sns:publish':
      case 'arn:aws:states:::sns:publish.waitForTaskToken':
        resource = value.Parameters && value.Parameters.TopicArn;
        break;
      case 'arn:aws:states:::sqs:sendMessage':
      case 'arn:aws:states:::sqs:sendMessage.waitForTaskToken':
        resource = value.Parameters && value.Parameters.QueueUrl;
        break;
      case 'arn:aws:states:::states:startExecution':
      case 'arn:aws:states:::states:startExecution.sync':
      case 'arn:aws:states:::states:startExecution.waitForTaskToken':
        resource = value.Parameters.StateMachineArn;
        break;
      default:
        return null;
    }
    if (!resource || typeof resource !== 'string') {
      return null;
    }

    const match = resource.match(/^\${([a-zA-Z0-9]+)}$/);
    if (match) {
      return match[1];
    }
    return resource;
  },
  // For a step function task state, compose a text representation of the path to the
  // state, given the jsonpath node path coponents.
  BuildStateIdFromPath: (pathComponents: any, context: any) => {
    // The path is expected to start with  e.g. [$, Resources, StateMachine, Properties, Definition, States]
    // but only the components after 'States' are used to create the StateId.
    pathComponents = pathComponents.slice(6);

    let stateDefinition = context.value.Properties.Definition.States;
    if (!stateDefinition) {
      throw new Error('Expected state definition to include "States"');
    }

    const importantPathComponents = [];
    while (pathComponents.length > 0) {
      const pathComponent = pathComponents.shift();
      stateDefinition = stateDefinition[pathComponent];

      if (stateDefinition.Type === 'Task') {
        importantPathComponents.push(pathComponent);
        continue;
      }
      if (stateDefinition.Type === 'Map') {
        importantPathComponents.push(pathComponent);
        if (!stateDefinition.Iterator) {
          throw new Error("Expected map state to have 'Iterator'");
        }
        stateDefinition = stateDefinition.Iterator;
        let index = pathComponents.shift();
        if (index !== 'Iterator') {
          throw new Error("Expected Task states under 'Iterator.States'");
        }
        index = pathComponents.shift();
        if (index !== 'States') {
          throw new Error("Expected 'Iterator.States'");
        }
        if (!stateDefinition.States) {
          throw new Error("Expected map Iterator to include 'States'");
        }
        stateDefinition = stateDefinition.States;
        continue;
      }
      if (stateDefinition.Type === 'Parallel') {
        let index = pathComponents.shift();
        if (index !== 'Branches') {
          throw new Error("Expected Task state under 'Branches'");
        }
        if (!stateDefinition.Branches) {
          throw new Error("Expected 'Branches' under parallel state");
        }
        stateDefinition = stateDefinition.Branches;
        if (!stateDefinition || !Array.isArray(stateDefinition)) {
          throw new Error('Expected Branches to be an array');
        }

        index = pathComponents.shift();

        stateDefinition = stateDefinition[index];
        if (!stateDefinition.States) {
          throw new Error("Expected parallel branches to include 'States'");
        }
        stateDefinition = stateDefinition.States;
        index = pathComponents.shift();
        if (index !== 'States') {
          throw new Error("Expected parallel task states under 'States'");
        }
        continue;
      }
      throw new Error(`Unexpected state type ${stateDefinition.Type}`);
    }

    const path = importantPathComponents.join('.');
    return path;
  },
  // For step functions, we build integrations by finding resource names in the step function's
  // DefinitionSubstitutions, but it's complicated if the resource being substituted has its
  // UseExistingResource flag set -- in that case the substituted value will include "!If
  // FooUseExistingReso8urce'. This transformation will track down the target of an integration
  // in either case.
  ResourceFromDefinitionSubstitution: (value: any) => {
    if (typeof value !== 'object') {
      return value;
    }
    if ('Ref' in value) {
      return value.Ref;
    }
    if ('Fn::GetAtt' in value) {
      return value['Fn::GetAtt'][0];
    }
    // Connections to API gateway have a !Sub for the endpoint
    if ('Fn::Sub' in value) {
      const array = value['Fn::Sub'];
      if (Array.isArray(array) && array.length >= 2) {
        let resource = array[1];
        if (typeof resource === 'object' && 'ApiId' in resource) {
          resource = resource.ApiId;
          if (typeof resource === 'object' && 'Ref' in resource) {
            return resource.Ref;
          }
        }
      }
      return value;
    }
    if ('Fn::If' in value) {
      const array = value['Fn::If'];
      if (Array.isArray(array) && array.length === 3) {
        const resource = array[2];
        if ('Fn::GetAtt' in resource) {
          return resource['Fn::GetAtt'][0];
        }
        if ('Ref' in resource) {
          return resource.Ref;
        }
        return resource;
      }
    }
    return value;
  },
  OperationFromTaskResource: (value: any) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.split(':').pop();
  },

  // Check whether the state machine resource target is a dynamodb table. The value is ordinarily
  // a string like 'arn:aws:states:::dynamodb:putItem'.
  TargetTypeFromResource: (value: any) => {
    if (!value || typeof value !== 'string') {
      return value;
    }
    try {
      const splits = value.split(':');
      if (splits.length < 6) {
        return value;
      }
      return splits[5] === 'dynamodb' ? 'table' : 'non-table';
    } catch (err) {
      console.log('ERR: ', err);
    }
  },
  // Format VPC subnet IDs for inclusion in a state machine's DefinitionSubstitutions
  DefinitionSubstitutionSubnetsFromVpcConfig: (value: any) => ({
    'Fn::Sub': [
      // eslint-disable-next-line no-template-curly-in-string
      '[\\"${Subnets}\\"]',
      {
        Subnets: {
          'Fn::Join': [
            '\\",\\"',
            value === 'default'
              ? { Ref: 'DefaultVPCSubnets' }
              : value.SubnetIds,
          ],
        },
      },
    ],
  }),
  // This is called after a Boolean transformation after we try to locate
  // resources used to build a docker image. If we found the building resources
  // then the input value is true.
  DockerImageSource: (value: any) => (value ? 'SourceCode' : 'RepositoryImage'),
  // We messed up and originally put the full path to the Dockerfile into
  // Function Metadata. SAM wants it to be relative to the Docker context. This
  // gets the relative Dockerfile location from the context setting.
  DockerfileContextFixup: (value: any, context: any) =>
    typeof value === 'string'
      ? value.replace(
          new RegExp(`^${context['SETTING:ImageDockerContext']}/`),
          '',
        )
      : null,
};

export default transformations;
