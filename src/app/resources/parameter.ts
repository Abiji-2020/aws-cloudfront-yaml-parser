import cloneDeep from 'clone-deep';

const ENV_CONFIG_FORMAT_RE = /^AWS::SSM::Parameter::Value<(\S+)>$/;

declare const require: any;

export default class Parameter {
  ParameterId: any;
  Format: any;
  Default: any;
  _class?: string;
  constructor(parameterId: any, format: any, def: any) {
    this.ParameterId = parameterId;
    this.Format = format;
    if (def !== undefined) {
      this.Default = def;
    }
  }
  static fromParameterId(template: any, parameterId: any) {
    if (!(parameterId in template.Parameters)) {
      throw new Error(
        `Failed to get parameter data: Parameter ${parameterId} does not exist in template`,
      );
    }

    const parameter = template.Parameters[parameterId];

    const parameterInOldConfig =
      'Metadata' in template &&
      'EnvConfigParameters' in template.Metadata &&
      parameterId in template.Metadata.EnvConfigParameters;

    const parameterInNewConfig =
      'Metadata' in template &&
      'EnvConfigParameters' in template.Metadata &&
      parameterId in template.Metadata.EnvConfigParameters;

    if (!parameterInOldConfig && !parameterInNewConfig) {
      return new Parameter(parameterId, parameter.Type, parameter.Default);
    }

    const match = parameter.Type.match(ENV_CONFIG_FORMAT_RE);

    if (!match) {
      console.warn(
        ` env config parameter ${parameterId} in bad state: Parameter type ${parameter.Type} is not an SSM type`,
      );
      return new Parameter(parameterId, parameter.Type, parameter.Default);
    }

    const key = parameterInOldConfig
      ? template.Metadata.EnvConfigParameters[parameterId]
      : template.Metadata.EnvConfigParameters[parameterId];
      

    // Dynamic import to prevent circular dependency in import statements
    const EnvConfigParameter = require('./envConfigParameter').default;

    return new EnvConfigParameter(match[1], key, parameterId);
  }

  toJson() {
    const clone = cloneDeep(this, (val) => Object.assign({}, val));
    clone._class = this.constructor.name;
  }
  insertIntoTemplate(state: any) {
    const cfTemplate = state.cfTemplate(true);

    cfTemplate.Parameters = cfTemplate.Parameters || {};

    cfTemplate.Parameters[this.ParameterId] = {
      Type: this.Format,
    };

    if (this.Default !== undefined && this.Default !== null) {
      cfTemplate.Parameters[this.ParameterId].Default = this.Default;
    }

    state.parameters[this.ParameterId] = this;
  }

  reference() {
    return { Ref: this.ParameterId };
  }
}

const parameterExists = (object: any, parameterId: any) => {
  if (typeof object !== 'object') {
    return false;
  }

  if (Object.keys(object).length === 1 && object.Ref === parameterId) {
    return true;
  }

  for (const key in object) {
    if (parameterExists(object[key], parameterId)) {
      return true;
    }
  }

  return false;
};
