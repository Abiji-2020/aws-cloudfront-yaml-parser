import { yamlParse } from 'yaml-cfn';
import State from '../resources';

export default (yaml: string, format: 'SAM'| 'serverless', isDeployView: any  = false) => {

    console.log("YAML value", yaml);
    console.log("Format value", format);
    console.log("isDeployView value", isDeployView);
    let template : any;
    try {
        template  = yamlParse(yaml);
    } catch (e) {
        (e as any).code = 'YAML_PARSE_ERROR';
        throw e;
    }
    console.log("Template value", template);

    let state: any ;
    try {
        state = new State(template, format, isDeployView);
    }catch(e){
        (e as any).code = 'STATE_ERROR';
        throw e;
    }
    console.log(state);
    return state;
}