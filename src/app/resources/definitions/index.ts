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

const definitions = [
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
