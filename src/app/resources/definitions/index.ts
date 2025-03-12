import merge from 'deepmerge';
import cloneDeep from 'clone-deep';
import { intrinsicFunctionType } from '../manageCFResources';

import functionResource from './funtion';
import lambda from './lambda';
import timer from './timer';
import topic from './topic';
import virtualNetwork from './virtualNetwork';
import simpleTable from './simpleTable';
import api from './api';
import httpApi from './httpApi';
import implicitApi from './implicitApi';
import objectStore from './objectStore';
import table from './table';
import stream from './stream';
import bastion from './bastion';
import cdn from './cdn';
import dockerTask from './dockerTask';
import database from './database';
import queue from './queue';
import graphdb from './graphdb';
import graphql from './graphql';
import httpProxy from './httpProxy';
import edgeFunction from './edgeFunction';
import custom from './custom';
import graphqlToTable from './graphqlIntegrations/table';
import graphqlToFunction from './graphqlIntegrations/function';
import graphqlToHttpProxy from './graphqlIntegrations/httpProxy';
import secrets from './secrets';
import userPool from './userPool';
import userPoolClient from './userPoolClient';
import website from './website';
import websocket from './websocket';
import eventRule from './eventRule';
import layer from './layer';
import stateMachine from './stateMachine';
import cdnFunction from './cdnFunction';

const definitions = [
  functionResource,
  lambda,
  timer,
  topic,
  virtualNetwork,
  simpleTable,
  api,
  httpApi,
  implicitApi,
  objectStore,
  table,
  stream,
  bastion,
  cdn,
  dockerTask,
  database,
  queue,
  graphdb,
  graphql,
  httpProxy,
  edgeFunction,
  graphqlToTable,
  graphqlToFunction,
  graphqlToHttpProxy,
  custom,
  secrets,
  userPool,
  userPoolClient,
  websocket,
  website,
  eventRule,
  layer,
  stateMachine,
  cdnFunction,
].reduce((definitions, definition) =>
  merge((definitions as any) || {}, definition as any),
);

const SERVERLESS_RESOURCES_RE =
  /^\$\.(Metadata[.[]|Resources[.[]|Conditions[.[])/;
const SERVERLESS_FN_SUB_RE = /\$\{([^}]*)\}/g;
const formatResolver = (definition: any, format: 'serverless' | 'SAM') => {
  if (definition && typeof definition === 'object') {
    if (Object.keys(definition).length === 1 && 'Format' in definition) {
      return formatResolver(definition.Format[format], format);
    }

    for (const key in definition) {
      const subDefinition = definition[key];

      if (
        subDefinition &&
        typeof subDefinition === 'object' &&
        'OnlyFormats' in subDefinition
      ) {
        if (subDefinition.OnlyFormats.includes(format)) {
          definition[key] = formatResolver(subDefinition, format);
          delete definition[key].OnlyFormats;
        } else {
          delete definition[key];
        }
      } else {
        definition[key] = formatResolver(subDefinition, format);
      }
    }
  } else if (format === 'serverless' && typeof definition === 'string') {
    /* Serverless CF resources are defined under the `resources` key. Rather
     * than parameterize every definition, simply update them here. */
    definition = definition.replace(SERVERLESS_RESOURCES_RE, '$.resources.$1');
  }

  if (format === 'serverless') {
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
  }

  return definition;
};

export const SAM = formatResolver(cloneDeep(definitions), 'SAM');
export const serverless = formatResolver(cloneDeep(definitions), 'serverless');
