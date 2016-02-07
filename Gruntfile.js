module.exports = function(grunt) {
  var bannerContent = "/*<%= pkg.name %>-v<%= pkg.version%>, <%= pkg.author%>*/\n'use strict';\n"
  var name = "<%= pkg.name %>-v<%= pkg.version%>";

  grunt.initConfig({
    pkg : grunt.file.readJSON("package.json"),
    jshint: {
      options: {
        eqeqeq: true,
        esversion: 6,
        trailing: true
      },
      target: {
        src : ["src/**/*.js", "test/**/*.js"]
      }
    },
    
    watch: {
      files: ["src/**/*.js", "test/**/*.js", "src/**/*.ohm"],
      tasks: ["default"],
      options: {
        spawn: false,
        livereload: true,
      },
    },


    concat: {
      options: {
        banner: bannerContent,
        process: function(src, filepath) {
          if ( filepath.substr(-3) === "ohm") {
            return "var " + filepath.match(/([^\/]*)$/)[1].replace(/\./,"_") + " = " + 
              "'" +  
              src.replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\r\n|\r|\n/g, "\\n") +
              "'" + 
              "\n";
          } else {
            return '// Source: ' + filepath + '\n' + src
          }
        },
      },
      target : {
        src : ["src/like.ohm", "src/**/*.js"],
        dest : "distrib/" + name + ".js"
      }
    },
    

    uglify: {
      options: {
        // banner: bannerContent,
        sourceMapRoot: "../",
        sourceMap: "distrib/"+name+".min.js.map",
        sourceMapUrl: name+".min.js.map"
      },
      target : {
        src : ["src/**/*.js"],
        dest : "distrib/" + name + ".min.js"
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
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-mocha");

  grunt.registerTask("default", ["concat"]);
};
