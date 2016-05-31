#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var rdir = path.join.bind(path, process.cwd());
var postcss = require('postcss');
var plugin = require('../dist/index');
var args = process.argv.splice(2);
var DEFAULT = {
    src: rdir('./src/styles'),
    dest: rdir('./dest/styles'),
    index: rdir('./dest/styles.js'),
    once: false
};
var asFunctionSource = require('../dist/source').asFunctionSource;
var conf = Object.assign({}, DEFAULT);
function compile(name, input, output) {
    var p = postcss(plugin({toJSON:asFunctionSource, toStyleSheet: output}));
    return p.process(input, {from: name, to: name});
}
function help(err) {
    if (err) {
        console.warn(err);
    }
    console.log(`
  -h  --help This message.
  -1  --once  ${DEFAULT.once} Run once and exit .
  -w  --watch ${DEFAULT.src} Directory to watch 
  -d  --dest  ${DEFAULT.dest} Where to write transformed to
  -i  --index ${DEFAULT.index}   
  
  config: 
  ${JSON.stringify(conf)}
`);
    process.exit(1);
}
for (var i = 0, l = args.length; i < l; i++) {
    switch (args[i]) {
        case '-h':
        case '--help':
            return help();
        case '-1':
        case '--once':
            conf.once = true;
            break;
        case '-w':
        case '--watch':
            conf.src = rdir(args[++i]);
            break;
        case '-d':
        case '--dest':
            conf.dest = rdir(args[++i]);
            break;
        case '-i':
        case '--index':
            conf.index = rdir(args[++i]);
            break
    }
}

function mkpath(dir) {
    var dirs = dir.split(path.sep);
    var file = dirs.pop();
    var d = '';
    while (dirs.length) {
        d = `${d}${path.sep}${dirs.shift()}`;
        if (!fs.existsSync(d)) {
            fs.mkdirSync(d);
        }
    }
    return file;
}

if (conf.once) {
    handleCss(fs.readdirSync(conf.src).filter(v=>/\.s?css$/.test(v))).then(()=> {
        process.exit(0);

    });
}

var watchman = require('fb-watchman');
var client = new watchman.Client();

console.log('watching', rdir(conf.src));
client.capabilityCheck({optional: [], required: ['relative_root']}, function (error, resp) {
    if (error) {
        console.log(error);
        client.end();
        return;
    }

    // Initiate the watchers
    watcher(client, conf.src, ['*.scss', '*.css'], function (files) {
        handleCss(files.map(v=>v.name));
    });
});

function handleCss(files) {
    const all = files.map((file)=> {
        if (/\.s?css/.test(file)) {
            const read = fs.readFileSync(path.join(conf.src, file)) + '';
            return compile(file, read, function (source) {
                console.log('source', source);
                try {
                    var f = mkpath(path.join(conf.dest, file + '.js'));

                    fs.writeFileSync(path.join(conf.dest, f), source);
                } catch (e) {
                    console.warn('could not write ', file);
                }
            });
        }
    });
    if (conf.index) {
        all.push(writeIndex(files, conf.index, /(\.s?css)$/));
    }
    return Promise.all(all);
}


function writeIndex(files, index, re) {
    console.log('writing', index, files.join(','));
    const file = mkpath(index);
    fs.writeFileSync(path.join(conf.dest, file), `module.exports = ${writeObj(files, index, re)}`);
}

function writeObj(files, index, re) {
    return `{

${files.map((v)=> {
        var ve = re ? v.replace(re, '') : v;
        var req = JSON.stringify('./' + v);
        return `${JSON.stringify(ve)}: require(${req})`;
    }).join(',\n')}
        };\n`;
}
function watcher(client, index, pattern, handler) {
    client.command(['watch-project', index], function (err, resp) {
        subscribe(client, resp.watch, index, pattern, handler);
    });
}

function subscribe(client, watch, relative_path, patterns, handler) {
    var subscribe = `subscribe-${relative_path.replace('/', '-')}`;

    client.command(['subscribe', watch, subscribe, {
            expression: ["anyof"].concat(patterns.map(pattern=>["match", pattern])),
            fields: ["name", "size", "exists", "type"],
            relative_root: relative_path
        }],
        function (error, resp) {
            if (error) {
                // Probably an error in the subscription criteria
                console.error('failed to subscribe: ', error);
                return;
            }
            console.log('subscription ' + resp.subscribe + ' established');
        });

    client.on('subscription', function (resp) {
        if (resp.subscription == subscribe) {
            console.log('file changed: ' + relative_path);
            handler(resp.files);
        }
    });
}