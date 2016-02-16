module.exports = function(grunt) {
  var bannerContent = "/*<%= pkg.name %>-v<%= pkg.version%>, <%= pkg.author%>*/\n'use strict';\n"
  var name = "<%= pkg.name %>-v<%= pkg.version%>";

  grunt.initConfig({
    pkg : grunt.file.readJSON("package.json"),
    watch: {
      files: ["src/**/*.js", "test/**/*.js", "src/**/*.ohm"],
      tasks: ["concat", "exec:mocha"],
      options: {
        spawn: false,
        livereload: true,
      },
    },
    concat: {
      options: {
        process: function(src, filepath) {
          if ( filepath.substr(-3) === "ohm") {
            return "module.exports = '" +  
              src.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\r\n|\r|\n/g, "\\n") +
              "'\n";
          } else {
            return '// Source: ' + filepath + '\n' + src
          }
        },
      },
      target : {
        src: ["src/like.ohm"],
        dest: "gen/like.ohm.js"
      }
    },
    exec: {
      refresh_browser: {
        command: "osascript ~/Desktop/refresh.scpt"
      },
      mocha: {
        command: "mocha --harmony"
      }
    },
    browserify: {
      target: {
        src: ['src/like.js'],
        dest: "dist/" + name + ".js"
      },
      options: { 
        browserifyOptions: {
          standalone: "like",
        }
      }
    },
    mocha: {
      all: {
        src: ["test/index.html"]
      },
      options: { 
        run: true
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-mocha");
  grunt.loadNpmTasks("grunt-exec");
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask("default", ["concat", "browserify"]);
};
