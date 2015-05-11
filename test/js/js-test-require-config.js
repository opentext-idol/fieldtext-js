/*
 * Copyright 2013-2015 Hewlett-Packard Development Company, L.P.
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with the License.
 */

define(function() {
    require.config({
        baseUrl: '.',
        paths: {
            // lib
            jquery: 'bower_components/jquery/jquery',
            'js-testing': 'bower_components/hp-autonomy-js-testing-utils/src/js',
            underscore: 'bower_components/underscore/underscore',
            text: 'bower_components/requirejs-text/text',
            peg: 'bower_components/pegjs/peg-0.8.0',

            //dir
            test: 'test/js',

            // mock
            store: 'test/js/mock/store'
        },
        shim: {
            underscore: {
                exports: '_'
            },
            peg: {
                exports: 'PEG'
            }
        },
        // the jasmine grunt plugin loads all files based on their paths on disk
        // this breaks imports beginning in real or js-whatever
        // map here fixes it
        // list mocks here, not above
        map: {
            '*': {
                'fieldtext': 'src'
            }
        }
    });
});