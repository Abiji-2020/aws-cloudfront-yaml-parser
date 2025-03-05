

export const intrinsicFunctionType = (value:any) =>{
    if(!value || typeof value !== 'object' || Object.keys(value).length !== 1){
        return null;
    }
    const [key] = Object.keys(value);
    if(key === 'Ref' || key.startsWith('Fn::')){
        return key;
    }
    return null;
}