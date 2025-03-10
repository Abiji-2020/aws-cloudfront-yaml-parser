import cloneDeep from 'clone-deep';
import parse from './parse';

export default class State {
  template: { [key: string]: any } = {};
  resources: { [key: string]: any } = {};
  format: 'SAM' | 'serverless' = 'SAM';
  constructor(
    template: { [key: string]: any },
    format: 'SAM' | 'serverless',
    isDeployView = false,
  ) {
    if (!template || typeof template !== 'object') {
      template = {};
    }

    for (const section of [
      'Resources',
      'Conditions',
      'Parameters',
      'Metadata',
    ]) {
      if (
        section in template &&
        (!template[section] || typeof template[section] !== 'object')
      ) {
        delete template[section];
      }
    }
    this.parseAndSetInstanceState(template, format, isDeployView);
  }

  private reparseTemplate() {
    this.parseAndSetInstanceState(this.template, this.format);
  }

  private parseAndSetInstanceState(
    template: { [key: string]: any },
    format: 'SAM' | 'serverless',
    isDeployView = false,
  ) {
    const parsed = parse(template, format, isDeployView);
    this.template = parsed.template;
    this.format = format;
  }
}
