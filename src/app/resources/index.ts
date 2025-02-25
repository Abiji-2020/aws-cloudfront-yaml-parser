import parse from './parse';

export default class State {
  template: { [key: string]: any } = {};
  resources: { [key: string]: any } = {};
  format: 'SAM' | 'Serverless' = 'SAM';
  constructor(template: { [key: string]: any }, format: 'SAM' | 'Serverless') {
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
    this.parseAndSetInstanceState(template, format);
  }
  private reparseTemplate() {
    this.parseAndSetInstanceState(this.template, this.format);
  }
  private parseAndSetInstanceState(
    template: { [key: string]: any },
    format: 'SAM' | 'Serverless',
  ) {
    const parsed = parse(template, format);
    this.template = template;
  }
}
