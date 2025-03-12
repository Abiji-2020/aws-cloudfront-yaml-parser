import Parameter from './parameter';

const LOGICAL_ID_FILTER_RE = /[^a-zA-Z0-9]/g;
const SSM_KEY_FILTER_RE = /[^a-zA-Z0-9_/-]/g;
const SSM_KEY_HIEARACHY_RE = /\./g;

export default class EnvConfigParameter extends Parameter {
  Key: any;
  constructor(format: 'SAM' | 'serverless', key: any, parameterId: any) {
    if (!parameterId) {
      const keyPart = key.replace(LOGICAL_ID_FILTER_RE, '');
      const formatPart = format.replace(LOGICAL_ID_FILTER_RE, '');

      parameterId = `EnvConfig${keyPart}As${formatPart}`;
    }

    super(parameterId, format, undefined);

    this.Key = key;
  }

  override insertIntoTemplate(state: any) {
    super.insertIntoTemplate(state);

    let ssmKey = this.Key.replace(SSM_KEY_HIEARACHY_RE, '/').replace(
      SSM_KEY_FILTER_RE,
      '',
    );

    if (this.Format.startsWith('List<')) {
      ssmKey += '/AsList';
    }

    const cfTemplate = state.cfTemplate();

    const parameter = cfTemplate.Parameters[this.ParameterId];

    parameter.Default = `/<EnvironmentName>/${ssmKey}`;
    parameter.Type = `AWS::SSM::Parameter::Value<${this.Format}>`;

    cfTemplate.Metadata = cfTemplate.Metadata || {};

    // Convert cfnEnvConfigParameters to EnvConfigParameters
    if ('cfnEnvConfigParameters' in cfTemplate.Metadata) {
      cfTemplate.Metadata.EnvConfigParameters =
        cfTemplate.Metadata.cfnEnvConfigParameters;
      delete cfTemplate.Metadata.cfnEnvConfigParameters;
    }

    cfTemplate.Metadata.EnvConfigParameters =
      cfTemplate.Metadata.EnvConfigParameters || {};

    const paramMetadata = cfTemplate.Metadata.EnvConfigParameters;
    paramMetadata[this.ParameterId] = this.Key;
  }
}
