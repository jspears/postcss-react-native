const css = {},
    px = 1,
    vendor = config.vendor,
    inch = 96,
    vh = config.height / 100,
    vw = config.width / 100,

    units = {
        px: px,
        vh: vh,
        vw: vw,
        'in': inch,
        pt: (inch / 72),
        em: 1,
        pc: 12 * (inch / 72),
        vmin: Math.min(vw, vh),
        vmax: Math.max(vw, vh)
    };


(function (exports, root) {

    let _style = function (FEATURES, config) {
        const css = {};
        return css;
    };
    let _sstyle = StyleSheet.create(_style);
    exports["View"] = React.createClass({
        displayName: "View",
        componentWillMount(){
            this._listen = listen.add(()=> {
                _sstyle = StyleSheet.create(_style);
                this.forceUpdate();
            });
        },
        componentWillUnmount(){
            this._listen && this._listen();
        },
        render(){
            var props = Object.assign({}, this.props);
            delete props.children;
            props.style = _sstyle;
            return React.createElement(pkgs.Native, props, children);
        }

    });
})(module.exports, root);

