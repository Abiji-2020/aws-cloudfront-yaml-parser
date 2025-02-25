import { yamlParse } from 'yaml-cfn';

export class TemplateParser {
  parse(template: string): object {
    try {
      return yamlParse(template);
    } catch (e) {
      console.log(e);
      return {};
    }
  }
  getState(template: object) {}
}
