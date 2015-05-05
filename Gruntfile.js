var path = require('path');
var fs = require('fs');

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    var globalConfig = {
        destdir: 'build',
        srcdir: 'examples'
    };

    var replaceStep = {
        name: 'replace',
        createConfig: function (context, block) {
            context.options.blocks.dest = path.join(context.outDir, this.name + '/');
            context.options.insert.src = context.options.blocks.dest + '*.html';
            context.options.blocks.replacements.push({
                from: new RegExp(block.raw.join('\\s*')),
                to: '<!-- insert:' + block.type + '[' + path.join(context.inDir, block.dest) + '] -->'
            });
            return {};
        }
    };

    grunt.initConfig({
        globalConfig: globalConfig,
        multi: {
            allprojects: {
                options: {
                    logBegin: function (vars) {
                        grunt.log.writeln(('Begin build subproject: ' + vars.projects.cyan));
                    },
                    logEnd: function (vars) {
                        grunt.log.writeln('Subproject: ' + vars.projects.cyan + ' success'.green);
                    },
                    vars: {
                        projects: {
                            patterns: ['*', '!img*'],
                            options: {
                                cwd: globalConfig.srcdir,
                                filter: 'isDirectory'
                            }
                        }
                    },
                    config: {
                        project: '<%= projects %>'
                    },
                    tasks: ['clean:stage', 'useminPrepare', 'concat', 'uglify', 'cssmin', 'replace:blocks', 'clean:subproject', 'replace:insert', 'htmlmin', 'clean:stage']
                }
            }
        },
        useminPrepare: {
            html: '<%= globalConfig.srcdir %>/<%= project %>/index.html',
            options: {
                dest: '.tmp/<%= project %>',
                staging: '.tmp/<%= project %>',
                root: '.',
                flow: {
                    steps: {'js': ['concat', 'uglifyjs', replaceStep], 'css': ['concat', 'cssmin', replaceStep]},
                    post: {}
                }
            }
        },
        replace: {
            blocks: {
                src: ['<%= globalConfig.srcdir %>/<%= project %>/index.html'],
                replacements: []
            },
            insert: {
                dest: '<%= globalConfig.destdir %>/<%= project %>/',
                replacements: [
                    {
                        from: /<!-- insert:(\w+)\[(.+)\] -->/g,
                        to: function (matchedWord, index, fullText, regexMatches) {
                            var tag = (regexMatches[0] === 'js') ? 'script' : 'style';
                            return '<' + tag + '><%= grunt.file.read("' + regexMatches[1] + '") %></' + tag + '>';
                        }
                    }
                ]
            }
        },
        htmlmin: {
            index: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    '<%= globalConfig.destdir %>/<%= project %>/index.html': '<%= globalConfig.destdir %>/<%= project %>/index.html'
                }
            }
        },
        clean: {
            stage: ['.tmp/<%= project %>'],
            stageAll: ['.tmp'],
            project: ['<%= globalConfig.destdir %>/<%= project %>/..'],
            subproject: {
                rd: ['<%= globalConfig.destdir %>/<%= project %>']
            }
        }
    });

    grunt.registerTask('default', ['clean:stageAll', 'multi:allprojects', 'clean:stageAll']);
};
