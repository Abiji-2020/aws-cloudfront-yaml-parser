import api from './api';
import bastion from './bastion';
import cdn from './cdn';
import cdnFunction from './cdnFunction';
import custom from './custom';
import database from './database';
import dockerTask from './dockerTask';
import edgeFunction from './edgeFunction';
import eventRule from './eventRule';
import funtionResource from './funtion';
import graphdb from './graphdb';
import graphql from './graphql';
import httpApi from './httpApi';
import httpProxy from './httpProxy';
import implicitApi from './implicitApi';
import lambda from './lambda';
import layer from './layer';
import objectStore from './objectStore';
import queue from './queue';
import secrets from './secrets';
import stream from './stream';
import simpleTable from './simpleTable';
import stateMachine from './stateMachine';
import table from './table';
import timer from './timer';
import topic from './topic';
import userPool from './userPool';
import userPoolClient from './userPoolClient';
import virtualNetwork from './virtualNetwork';
import website from './website';
import websocket from './websocket';
import graphqlToTable from './graphqlIntegrations/table';
import graphqlToFunction from './graphqlIntegrations/function';
import graphqlToHttpProxy from './graphqlIntegrations/httpProxy';
import { intrinsicFunctionType } from '../manageCFResources';
import cloneDeep from 'clone-deep';

const definitions = [
  graphqlToFunction,
  graphqlToTable,
  graphqlToHttpProxy,
  api,
  topic,
  userPool,
  userPoolClient,
  virtualNetwork,
  website,
  websocket,
  layer,
  objectStore,
  queue,
  secrets,
  stream,
  simpleTable,
  stateMachine,
  table,
  timer,
  bastion,
  cdn,
  cdnFunction,
  custom,
  database,
  dockerTask,
  edgeFunction,
  eventRule,
  funtionResource,
  graphdb,
  graphql,
  httpApi,
  httpProxy,
  implicitApi,
  lambda,
];

const SERVERLESS_RESOURCES_RE =
  /^\$\.(Metadata[.[]|Resources[.[]|Conditions[.[])/;
const SERVERLESS_FN_SUB_RE = /\$\{([^}]*)\}/g;

const formatResolver = (definition: any, format: string) => {
  if (definition && typeof definition === 'object') {
    if (Object.keys(definition).length === 1 && 'Format' in definition) {
      return formatResolver(
        (definition['Format'] as any)[format] as Object,
        format,
      );
    }

    for (const key in definition) {
      const subDefinition = definition[key];

      if (
        subDefinition &&
        typeof subDefinition === 'object' &&
        'OnlyFormats' in subDefinition
      ) {
        if (subDefinition['OnlyFormats'].includes(format)) {
          definition[key] = formatResolver(subDefinition, format);
          delete definition[key]['OnlyFormats'];
        } else {
          delete definition[key];
        }
      } else {
        definition[key] = formatResolver(subDefinition, format);
      }
    }
  } else if (format === 'Serverless' && typeof definition === 'string') {
    definition = definition.replace(SERVERLESS_RESOURCES_RE, '$.Resources.$1');
  }
  if (format === 'Serverless') {
    const type = intrinsicFunctionType(definition);
    if (type === 'Fn::Sub') {
      if (Array.isArray(definition['Fn::Sub'])) {
        definition['Fn::Sub'][0] = definition['Fn::Sub'][0].replace(
          SERVERLESS_FN_SUB_RE,
          '#{$1}',
        );
      } else {
        definition['Fn::Sub'] = definition['Fn::Sub'].replace(
          SERVERLESS_FN_SUB_RE,
          '#{$1}',
        );
      }
    }

    return definition;
  }
};

export const SAM = formatResolver(cloneDeep(definitions), 'SAM');

export const serverless = formatResolver(cloneDeep(definitions), 'serverless');
