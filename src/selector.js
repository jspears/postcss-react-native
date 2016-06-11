import selectorParser from 'postcss-selector-parser';

const parser = selectorParser();

export default function selector(selectorString) {
    const selector = parser.process(selectorString).res;
    let tag, sel, all = [];
    selector.walk(function ({type, value, namespace}) {
        switch (type) {
            case 'tag':
            case 'pseudo':
            case 'class':
            {
                if (!sel) {
                    sel = {};
                    if (namespace){
                        sel.namespace = namespace;
                    }
                    all.push(sel);
                }
                sel[type] = value;
                break;
            }
            case 'selector':
                if (sel) {
                    sel = {};
                    if (namespace){
                        sel.namespace = namespace;
                    }
                    all.push(sel);
                }
                break;
            default:
                console.warn(`selectors of type ${type} are not supported yet in selector ${selectorString}`);
        }
    });
    return all;
}
